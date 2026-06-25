import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@aottg2/ui";
import { useMutation } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { getAccessToken } from "@/auth/storage";
import { restoreModerationComment, type WorkshopComment } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import { ConfirmDialog, DetailRow, EmptyPanel, ListTitle, LoadingPanel, listItemClass } from "./Common";
import { formatDate } from "../utils";

export function CommentList({ comments, selectedId, loading, error, onSelect }: { comments: WorkshopComment[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Comments unavailable" text="Could not load hidden comments." />;
  if (!comments.length) return <EmptyPanel title="No comments" text="Nothing matches this queue." />;
  return (
    <div className="grid content-start gap-3">
      {comments.map((comment) => (
        <button key={comment.id} type="button" className={listItemClass(selectedId === comment.id)} onClick={() => onSelect(comment.id)}>
          <ListTitle title={comment.body} badge={comment.status} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>{comment.authorDisplayName}</span>
            <span>{formatDate(comment.updatedAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function CommentDetail({ comment, onDone }: { comment: WorkshopComment | null; onDone: () => void }) {
  const token = getAccessToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const restore = useMutation({
    mutationFn: () => restoreModerationComment(comment!.id, token!),
    onSuccess: () => {
      toast.success("Comment restored", { description: "The comment is visible again." });
      setConfirmOpen(false);
      onDone();
    },
    onError: (error) => toast.error("Restore failed", { description: error instanceof Error ? error.message : "Try again." }),
  });

  if (!comment) return <EmptyPanel title="Select a comment" text="Choose a comment from the queue." />;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Hidden Comment</CardTitle>
          <Badge variant="outline">{comment.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <DetailRow label="Body" value={comment.body} />
        <DetailRow label="Author" value={comment.authorDisplayName} />
        <DetailRow label="Updated" value={formatDate(comment.updatedAt)} />
        {comment.status === "hidden" ? <Button size="sm" disabled={restore.isPending} onClick={() => setConfirmOpen(true)}><RotateCcw className="h-4 w-4" />RESTORE</Button> : null}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        title="Restore Comment?"
        description="This will make the hidden comment visible again."
        confirmLabel="RESTORE"
        busy={restore.isPending}
        onOpenChange={setConfirmOpen}
        onConfirm={() => restore.mutate()}
      />
    </Card>
  );
}
