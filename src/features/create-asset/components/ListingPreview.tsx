import { useEffect, useState } from "react";
import type { WorkshopAsset } from "@/lib/api/workshop";
import { WorkshopAssetCard } from "@/components/WorkshopAssetCard";
import { previewCreatedAt, previewEngagement } from "../constants";
import { splitList } from "../form-utils";
import type { AssetKind, SkinCategory } from "../types";

export function ListingPreview({ kind, skinCategory, common, authorName }: { kind: AssetKind; skinCategory: SkinCategory; common: { title: string; shortDescription: string; thumbnailUrl: string; tags: string }; authorName: string }) {
  const title = common.title.trim() || "Untitled Asset";
  const thumbnailUrl = common.thumbnailUrl.trim();
  const asset: WorkshopAsset = {
    id: "preview",
    publicId: "preview",
    creatorName: "preview",
    assetSlug: "preview",
    status: "visible",
    type: kind,
    title,
    shortDescription: common.shortDescription.trim() || null,
    descriptionMarkdown: null,
    media: thumbnailUrl ? [{ kind: "thumbnail", url: thumbnailUrl, description: title }] : [],
    payload: previewPayload(kind, skinCategory),
    tags: splitList(common.tags),
    ownerAuthAccountId: "preview",
    authorDisplayName: authorName,
    createdAt: previewCreatedAt,
    updatedAt: previewCreatedAt,
    engagement: previewEngagement,
    viewerEngagement: null,
  };

  return (
    <aside className="grid content-start gap-3">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Card Preview</h2>
      <WorkshopAssetCard asset={asset} interactive={false} />
    </aside>
  );
}

function previewPayload(kind: AssetKind, skinCategory: SkinCategory) {
  if (kind === "map") return { file: null, metadata: null, screenshots: [] };
  if (kind === "custom_logic") return { files: [{ namespace: "Main", filename: "main.cs", content: "" }], metadata: null };
  if (kind === "addon") return { files: [{ filename: "addon.json", content: "", contentType: "application/json" }], metadata: null };
  return { category: skinCategory };
}

function CardPreviewImage({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return (
    <div className="relative aspect-video overflow-hidden bg-muted/50">
      <img className="absolute inset-0 h-full w-full object-cover" src={url} alt={title} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

export function GalleryPreview({ urls, title }: { urls: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const activeUrl = urls[index];
  const urlKey = urls.join("\n");

  useEffect(() => {
    setIndex(0);
  }, [urlKey]);

  return (
    <div className="grid gap-2 border border-border bg-card/50 p-3">
      <CardPreviewImage url={activeUrl ?? ""} title={title} />
      {urls.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {urls.map((url, itemIndex) => (
            <button key={`${url}-${itemIndex}`} type="button" className={`workshop-control-free relative aspect-video overflow-hidden border bg-muted/50 ${itemIndex === index ? "border-primary" : "border-border"}`} onClick={() => setIndex(itemIndex)}>
              <img className="absolute inset-0 h-full w-full object-cover" src={url} alt={title} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
