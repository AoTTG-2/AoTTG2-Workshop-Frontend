import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@aottg2/ui";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/auth/storage";
import { useAuth } from "@/auth/useAuth";
import { canModerateAssets } from "@/auth/workshopPermissions";
import { AssetTag } from "@/components/AssetTag";
import { ReportDialog } from "@/components/ReportDialog";
import { assetPath, createAssetDownloadUrl, deleteWorkshopAsset, listAssetUsedBy, reportWorkshopAsset, setAssetFavorite, setAssetLike, trackAssetDownload, type AddonPayload, type CustomLogicPayload, type MapPayload, type UploadedFileReference, type WorkshopAsset } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import { optimisticEngagement } from "../engagement";
import { markdownComponents } from "../markdown";
import { mediaForGallery } from "../media";
import { motionAnimate, motionInitial, motionTransition, replayReaction } from "../motion";
import { assetCategory, collectTextureUrls, isAddonPayload, isCustomLogicPayload, isMapPayload, summarizeAsset } from "../summary";
import { AssetComments } from "./AssetComments";
import { AssetDetailGallery } from "./AssetDetailGallery";
import { AssetDetailHeader } from "./AssetDetailHeader";
import { AssetDetailSidebar } from "./AssetDetailSidebar";

export function AssetDetailContent({ asset: sourceAsset, onRefresh }: { asset: WorkshopAsset; onRefresh: () => Promise<unknown> }) {
  const [displayAsset, setDisplayAsset] = useState(sourceAsset);
  const { isAuthenticated, profile, workshopUser } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const asset = displayAsset;
  const media = mediaForGallery(asset.media);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState(1);
  const [likeBurst, setLikeBurst] = useState(false);
  const [favoriteBurst, setFavoriteBurst] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const activeMedia = media[activeIndex];
  const textureUrls = collectTextureUrls(asset);
  const category = assetCategory(asset);
  const summary = summarizeAsset(asset);
  const liked = Boolean(asset.viewerEngagement?.liked);
  const favorited = Boolean(asset.viewerEngagement?.favorited);
  const publicAssetUrl = (typeof window === "undefined" ? "" : window.location.origin) + assetPath(asset);
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const permissionSource = workshopUser ?? profile;
  const isOwnAsset = Boolean(accountId && accountId === asset.ownerAuthAccountId);
  const canEditAsset = isAuthenticated && (isOwnAsset || canModerateAssets(permissionSource));
  const canDeleteAsset = canEditAsset;
  const usedByQuery = useQuery({
    queryKey: ["workshop", "asset-used-by", asset.publicId || asset.id],
    queryFn: () => listAssetUsedBy(asset.publicId || asset.id, getAccessToken()),
    enabled: asset.type === "skin_part",
  });
  const usedByAssets = usedByQuery.data?.assets ?? [];

  useEffect(() => setDisplayAsset(sourceAsset), [sourceAsset]);

  useEffect(() => {
    if (activeIndex >= media.length) setActiveIndex(0);
  }, [activeIndex, media.length]);

  function selectGalleryImage(index: number) {
    if (index === activeIndex) return;
    setGalleryDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }

  function moveGallery(offset: number) {
    setGalleryDirection(offset > 0 ? 1 : -1);
    setActiveIndex((current) => (current + offset + media.length) % media.length);
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(label + " copied", { description: "Copied to clipboard." });
    } catch {
      toast.error("Could not copy " + label.toLowerCase(), { description: "Clipboard access is unavailable or blocked." });
    }
  }

  async function submitAssetReport(reason: string, details: string | null) {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to report assets.", { description: "Reports are attached to your account." });
      return;
    }
    try {
      setReportBusy(true);
      await reportWorkshopAsset(asset.publicId || asset.id, reason, details, token);
      toast.success("Asset reported", { description: "Moderators can review it now." });
      setReportOpen(false);
    } catch (error) {
      toast.error("Could not report asset", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setReportBusy(false);
    }
  }

  async function importAsset() {
    const downloadReferences = collectDownloadReferences(asset);
    if (downloadReferences.length > 0) {
      try {
        const results = await Promise.all(downloadReferences.map((reference) => createAssetDownloadUrl(asset.publicId || asset.id, reference, getAccessToken())));
        const engagement = [...results].reverse().find((result) => result.engagement)?.engagement;
        if (engagement) setDisplayAsset((current) => ({ ...current, engagement: engagement.engagement ?? current.engagement, viewerEngagement: engagement.viewerEngagement ?? current.viewerEngagement }));
        else await onRefresh();

        if (results.length === 1) {
          window.location.assign(results[0].url);
          return;
        }

        await copyText("download URLs", results.map((result) => result.url).join("\n"));
      } catch (error) {
        toast.error("Could not create download URL", { description: error instanceof Error ? error.message : "Try again." });
      }
      return;
    }

    await copyText("asset JSON", JSON.stringify(asset.payload, null, 2));
    try {
      await trackAssetDownload(asset.id, getAccessToken());
      await onRefresh();
    } catch {
      // Import still worked; stats can refresh later.
    }
  }

  async function toggleLike() {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to thank assets.", { description: "Thanks are saved to your account." });
      return;
    }
    if (isOwnAsset) {
      toast.info("You can't thank your own asset.", { description: "Thanks are for other creators' assets." });
      return;
    }
    const nextLiked = !liked;
    replayReaction(setLikeBurst);
    const previousAsset = asset;
    setDisplayAsset((current) => optimisticEngagement(current, "likeCount", "liked", nextLiked));
    try {
      const result = await setAssetLike(asset.publicId || asset.id, nextLiked, token);
      setDisplayAsset((current) => ({ ...current, engagement: result.engagement, viewerEngagement: result.viewerEngagement ?? current.viewerEngagement }));
      toast.success(nextLiked ? "Sent Thanks to " + asset.title : "Removed Thanks from " + asset.title, { description: nextLiked ? "Thanks sent." : "Thanks removed." });
    } catch (error) {
      setDisplayAsset(previousAsset);
      toast.error("Could not update Thanks", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  async function toggleFavorite() {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to favorite assets.", { description: "Favorites are saved to your account." });
      return;
    }
    const nextFavorited = !favorited;
    replayReaction(setFavoriteBurst);
    const previousAsset = asset;
    setDisplayAsset((current) => optimisticEngagement(current, "favoriteCount", "favorited", nextFavorited));
    try {
      const result = await setAssetFavorite(asset.publicId || asset.id, nextFavorited, token);
      setDisplayAsset((current) => ({ ...current, engagement: result.engagement, viewerEngagement: result.viewerEngagement ?? current.viewerEngagement }));
      toast.success(nextFavorited ? "Favourited " + asset.title : "Removed favourite from " + asset.title, { description: nextFavorited ? "Saved to favourites." : "Removed from favourites." });
    } catch (error) {
      setDisplayAsset(previousAsset);
      toast.error("Could not update favourite", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  async function deleteAsset() {
    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Your session may have expired." });
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteWorkshopAsset(asset.publicId || asset.id, token);
      toast.success("Asset deleted", { description: "Removed from Workshop." });
      setDeleteOpen(false);
      router.push("/discover");
    } catch (error) {
      toast.error("Could not delete asset", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setDeleteBusy(false);
    }
  }

  if (asset.status !== "visible") {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/discover">
          Back to discover
        </Link>
        <div className="mt-6 border border-border bg-card/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-primary text-3xl uppercase">{asset.title}</h1>
            <AssetTag variant="category">{asset.status}</AssetTag>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{isOwnAsset || canModerateAssets(permissionSource) ? "This asset is hidden from the public." : "This asset is unavailable."}</p>
          {canModerateAssets(permissionSource) ? (
            <Button className="mt-5" type="button" onClick={() => router.push("/moderation")}>
              Open Moderation
            </Button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <motion.div initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0)}>
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/discover">
          Back to discover
        </Link>
      </motion.div>

      <AssetDetailHeader
        asset={asset}
        canDeleteAsset={canDeleteAsset}
        canEditAsset={canEditAsset}
        favoriteBurst={favoriteBurst}
        favorited={favorited}
        isOwnAsset={isOwnAsset}
        likeBurst={likeBurst}
        liked={liked}
        publicAssetUrl={publicAssetUrl}
        reduceMotion={reduceMotion}
        onCopyText={copyText}
        onEditAsset={() => router.push(assetPath(asset) + "/edit")}
        onFavoriteAnimationComplete={() => setFavoriteBurst(false)}
        onImport={() => void importAsset()}
        onLikeAnimationComplete={() => setLikeBurst(false)}
        onOpenDelete={() => setDeleteOpen(true)}
        onOpenReport={() => setReportOpen(true)}
        onToggleFavorite={() => void toggleFavorite()}
        onToggleLike={() => void toggleLike()}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <motion.section className="min-w-0 space-y-5" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(0.06)}>
          <AssetDetailGallery
            activeIndex={activeIndex}
            activeMedia={activeMedia}
            galleryDirection={galleryDirection}
            media={media}
            reduceMotion={reduceMotion}
            title={asset.title}
            onMove={moveGallery}
            onSelect={selectGalleryImage}
          />

          <motion.section className="border border-border bg-card/50 p-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.13)}>
            {asset.descriptionMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {asset.descriptionMarkdown}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </motion.section>
        </motion.section>

        <AssetDetailSidebar asset={asset} category={category} reduceMotion={reduceMotion} summary={summary} textureUrls={textureUrls} usedByAssets={usedByAssets} onCopyText={copyText} />
      </div>

      <AssetComments asset={asset} onAssetRefresh={onRefresh} />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>Delete &quot;{asset.title}&quot; from the Workshop library?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={deleteBusy} onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={deleteBusy} onClick={() => void deleteAsset()}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReportDialog open={reportOpen} title="Report Asset" description="Send this asset to the moderation queue." busy={reportBusy} onOpenChange={setReportOpen} onSubmit={submitAssetReport} />
    </main>
  );
}

function collectDownloadReferences(asset: WorkshopAsset) {
  if (asset.type === "map" && isMapPayload(asset.payload)) return hasDownloadReference(asset.payload.file) ? [asset.payload.file] : [];
  if (asset.type === "custom_logic" && isCustomLogicPayload(asset.payload)) return collectFileBundleReferences(asset.payload);
  if (asset.type === "addon" && isAddonPayload(asset.payload)) return collectFileBundleReferences(asset.payload);
  return [];
}

function collectFileBundleReferences(payload: CustomLogicPayload | AddonPayload) {
  return (payload.files ?? []).filter(hasDownloadReference);
}

function hasDownloadReference(file: MapPayload["file"]): file is UploadedFileReference & { uploadId: string } {
  return Boolean(file?.uploadId && (file.key || file.objectKey));
}
