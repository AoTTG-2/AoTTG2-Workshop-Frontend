import Link from "next/link";
import { SideCard } from "@/components/SideCard";
import { assetPath, type SkinSetItem, type WorkshopAsset } from "@/lib/api/workshop";
import { formatLabel } from "../format";
import { isGroupedSlot, isShifterSkinSetPayload, isSkinPartPayload, isSkinSetPayload, isSkyboxSkinSetPayload, summarizeGroupedSlot, summarizeSetItemDetails } from "../summary";

export function AssetSummary({ asset }: { asset: WorkshopAsset }) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    return (
      <dl className="grid gap-2 text-sm">
        <SummaryRow label="Slot" value={asset.payload.slot} />
        {isGroupedSlot(asset.payload.slot) ? (
          <>
            <SummaryRow label="Sides" value={summarizeGroupedSlot(asset.payload)} />
            {asset.payload.slot === "Hooks" ? <SummaryRow label="Hook Tilings" value={`${asset.payload.hookTilings?.left ?? 1} / ${asset.payload.hookTilings?.right ?? 1}`} /> : null}
          </>
        ) : (
          <>
            <SummaryRow label="Scope" value={asset.payload.variantScope} />
            <SummaryRow label="Variants" value={asset.payload.variants?.join(", ")} />
          </>
        )}
        {asset.payload.slot === "Costume" ? <SummaryRow label="Boots" value={asset.payload.boots === false ? "Off" : "On"} /> : null}
      </dl>
    );
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    return (
      <div className="grid gap-3 text-sm">
        {(asset.payload.items ?? []).map((item, index) => (
          <div key={`${item.slot}-${index}`} className="border-l border-border pl-3 text-muted-foreground">
            <div className="font-semibold text-foreground">Item {index + 1}: {item.slot ?? "Unknown slot"}</div>
            <SetItemSummary item={item} />
          </div>
        ))}
      </div>
    );
  }

  if (asset.type === "shifter_skin_set" && isShifterSkinSetPayload(asset.payload)) {
    return (
      <dl className="grid gap-2 text-sm">
        <SummaryRow label="Target" value={formatLabel(asset.payload.target ?? "shifter")} />
        <SummaryRow label="Texture URL" value={asset.payload.textureUrl} />
      </dl>
    );
  }

  if (asset.type === "skybox_skin_set" && isSkyboxSkinSetPayload(asset.payload)) {
    return (
      <dl className="grid gap-2 text-sm">
        <SummaryRow label="Top" value={asset.payload.up} />
        <SummaryRow label="Left" value={asset.payload.left} />
        <SummaryRow label="Front" value={asset.payload.front} />
        <SummaryRow label="Right" value={asset.payload.right} />
        <SummaryRow label="Back" value={asset.payload.back} />
        <SummaryRow label="Bottom" value={asset.payload.down} />
      </dl>
    );
  }

  return <pre className="overflow-auto bg-muted p-3 text-xs text-foreground">{JSON.stringify(asset.payload, null, 2)}</pre>;
}

export function UsedBySetsCard({ assets }: { assets: WorkshopAsset[] }) {
  return (
    <SideCard title="Used In Sets" variant="secondary">
      <div className="grid gap-2">
        {assets.map((asset) => (
          <Link key={asset.id} className="group border border-border bg-muted/30 p-3 hover:border-primary/70 hover:bg-muted/50" href={assetPath(asset)}>
            <span className="block truncate font-primary text-sm font-semibold uppercase text-foreground group-hover:text-primary">{asset.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">by {asset.authorDisplayName}</span>
          </Link>
        ))}
      </div>
    </SideCard>
  );
}

function SetItemSummary({ item }: { item: SkinSetItem }) {
  const details = summarizeSetItemDetails(item);
  return (
    <div className="break-words">
      {item.skinAssetId ? (
        <Link className="font-semibold text-primary hover:underline" href={`/library/${encodeURIComponent(item.skinAssetId)}`}>
          Linked skin part
        </Link>
      ) : (
        <span>{item.textureUrl || [item.textureUrls?.left, item.textureUrls?.right].filter(Boolean).join(" / ") || "no texture"}</span>
      )}
      {details ? <span>{details}</span> : null}
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}
