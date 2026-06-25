import { CommentBox, CommentSection, type CommentItem } from "@aottg2/ui";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/auth/api";
import { getAccessToken } from "@/auth/storage";
import { useAuth } from "@/auth/useAuth";
import { canModerateComments } from "@/auth/workshopPermissions";
import { CreatorMention } from "@/components/CreatorIdentityLink";
import { ReportDialog } from "@/components/ReportDialog";
import { createAssetComment, deleteWorkshopComment, hideModerationComment, listAssetComments, replyToAssetComment, reportWorkshopComment, type WorkshopAsset, type WorkshopComment } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import { formatDate } from "../format";
import { motionAnimate, motionInitial, motionTransition } from "../motion";
import { collectMentionAuthors, hasAvatarKey, initials, presetImageUrl, renderCommentMarkdownWithMentions } from "../commentsMarkdown";

export function AssetComments({ asset, onAssetRefresh }: { asset: WorkshopAsset; onAssetRefresh: () => Promise<unknown> }) {
  const { isAuthenticated, profile, workshopUser } = useAuth();
  const reduceMotion = useReducedMotion();
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const permissionSource = workshopUser ?? profile;
  const assetCommentId = asset.publicId || asset.id;
  const commentsQuery = useQuery({
    queryKey: ["workshop", "asset-comments", assetCommentId],
    queryFn: () => listAssetComments(assetCommentId),
    enabled: Boolean(assetCommentId),
  });
  const rawComments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data?.comments]);
  const needsAvatars = rawComments.some(hasAvatarKey);
  const presetsQuery = useQuery({
    queryKey: ["auth", "profile-presets"],
    queryFn: async () => {
      const result = await authApi.getProfilePresets();
      if (!result.ok) throw new Error(result.data.error ?? "Failed to load profile presets");
      return result.data;
    },
    enabled: needsAvatars,
    staleTime: 60 * 60 * 1000,
  });
  const avatarByKey = useMemo(() => new Map((presetsQuery.data?.avatars ?? []).map((preset) => [preset.key, preset])), [presetsQuery.data?.avatars]);
  const mentionAuthors = useMemo(() => collectMentionAuthors(rawComments), [rawComments]);
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ commentId: string; rowId: string; author: string } | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    if (!replyTo) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`reply-box-${replyTo.rowId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [replyTo]);

  function startReply(commentId: string, rowId: string, author: string) {
    setReplyTo({ commentId, rowId, author });
    setReplyBody(`@${author} `);
  }

  async function refreshAfterWrite() {
    await commentsQuery.refetch();
    await onAssetRefresh();
  }

  async function submitComment() {
    const token = getAccessToken();
    const text = body.trim();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to comment.", { description: "Comments are saved to your account." });
      return;
    }
    if (!text) {
      toast.error("Comment is empty.", { description: "Write something before posting." });
      return;
    }
    if (text.length > 1000) {
      toast.error("Comment is too long.", { description: "Keep comments under 1000 characters." });
      return;
    }

    try {
      setBusy(true);
      await createAssetComment(assetCommentId, text, token);
      setBody("");
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not post comment", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function submitReply() {
    const token = getAccessToken();
    const text = replyBody.trim();
    if (!isAuthenticated || !token || !replyTo) return;
    if (!text) {
      toast.error("Reply is empty.", { description: "Write something before posting." });
      return;
    }
    if (text.length > 1000) {
      toast.error("Reply is too long.", { description: "Keep replies under 1000 characters." });
      return;
    }

    try {
      setBusy(true);
      await replyToAssetComment(assetCommentId, replyTo.commentId, text, token);
      setReplyBody("");
      setReplyTo(null);
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not post reply", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Your session may have expired." });
      return;
    }
    try {
      await deleteWorkshopComment(commentId, token);
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not delete comment", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  async function submitCommentReport(reason: string, details: string | null) {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to report comments.", { description: "Reports are attached to your account." });
      return;
    }
    if (!reportCommentId) return;
    try {
      setReportBusy(true);
      await reportWorkshopComment(reportCommentId, reason, details, token);
      toast.success("Comment reported", { description: "Moderators can review it now." });
      setReportCommentId(null);
    } catch (error) {
      toast.error("Could not report comment", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setReportBusy(false);
    }
  }

  async function hideComment(commentId: string) {
    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Your session may have expired." });
      return;
    }
    try {
      await hideModerationComment(commentId, token);
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not hide comment", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  function toItem(comment: WorkshopComment, parent = comment): CommentItem {
    const tombstone = comment.status === "deleted" || comment.status === "hidden";
    const canWrite = isAuthenticated && !tombstone;
    const avatarUrl = presetImageUrl(comment.authorAvatarKey ? avatarByKey.get(comment.authorAvatarKey) : undefined);
    const actions = canWrite
      ? [
          { label: "Reply", onSelect: () => startReply(parent.id, comment.id, comment.authorDisplayName) },
          accountId === comment.authorAuthAccountId ? { label: "Delete", destructive: true, onSelect: () => void deleteComment(comment.id) } : null,
          canModerateComments(permissionSource) && comment.status === "visible" ? { label: "Hide", destructive: true, onSelect: () => void hideComment(comment.id) } : null,
          accountId !== comment.authorAuthAccountId ? { label: "Report", destructive: true, onSelect: () => setReportCommentId(comment.id) } : null,
        ].filter((item): item is NonNullable<typeof item> => item !== null)
      : undefined;

    return {
      id: comment.id,
      author: {
        name: <CreatorMention displayName={comment.authorDisplayName} creatorName={comment.authorCreatorName}>{comment.authorDisplayName}</CreatorMention>,
        avatarUrl,
        fallback: initials(comment.authorDisplayName),
      },
      createdAt: formatDate(comment.createdAt),
      editedAt: comment.updatedAt !== comment.createdAt ? formatDate(comment.updatedAt) : undefined,
      body: renderCommentMarkdownWithMentions(comment.body, mentionAuthors),
      deleted: tombstone,
      actions,
      replies: comment.replies.map((reply) => toItem(reply, comment)),
    };
  }

  const comments = rawComments.map((comment) => toItem(comment));

  return (
    <>
    <motion.section className="mt-5 border-t border-border pt-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.1)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-primary text-2xl uppercase leading-none text-foreground">Comments</h2>
          <p className="mt-1 text-sm text-muted-foreground">{commentsQuery.data?.total ?? asset.engagement?.commentCount ?? 0} visible threads</p>
        </div>
        {!isAuthenticated ? <span className="text-sm text-muted-foreground">Sign in to comment or report.</span> : null}
      </div>

      <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.13)}>
        <CommentBox
          value={body}
          onChange={setBody}
          onSubmit={() => void submitComment()}
          submitLabel="Comment"
          placeholder="Write a comment..."
          disabled={busy || !isAuthenticated}
          textareaProps={{ maxLength: 1000 }}
        />
      </motion.div>

      <motion.div className="mt-4" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.16)}>
        <CommentSection
          className="workshop-comment-stagger"
          comments={comments}
          empty={commentsQuery.isLoading ? "Loading comments..." : commentsQuery.isError ? "Comments could not be loaded." : "No comments yet."}
          renderBody={(comment) => (
            <>
              {comment.body}
              {replyTo?.rowId === comment.id ? (
                <motion.div initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
                  <CommentBox
                    id={`reply-box-${comment.id}`}
                    className="mt-3"
                    value={replyBody}
                    onChange={setReplyBody}
                    onSubmit={() => void submitReply()}
                    onCancel={() => { setReplyTo(null); setReplyBody(""); }}
                    submitLabel="Reply"
                    placeholder={`Reply to ${replyTo.author}...`}
                    disabled={busy}
                    textareaProps={{ maxLength: 1000 }}
                  />
                </motion.div>
              ) : null}
            </>
          )}
        />
      </motion.div>
    </motion.section>
    <ReportDialog open={Boolean(reportCommentId)} title="Report Comment" description="Send this comment to the moderation queue." busy={reportBusy} onOpenChange={(open) => !open && setReportCommentId(null)} onSubmit={submitCommentReport} />
    </>
  );
}
