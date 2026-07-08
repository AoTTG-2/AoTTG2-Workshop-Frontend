import type { AddonForm, AssetKind, CommonAssetForm, CustomLogicForm, MapForm, ShifterSkinSetForm, SkyboxSkinSetForm, VariantTargetForm } from "../types";
import { mediaUrls, splitList, formatLabel } from "../form-utils";
import { reviewDataSummary } from "../payload";

export function ReviewSummary({
  kind,
  common,
  part,
  items,
  shifter,
  skybox,
  map,
  customLogic,
  addon,
}: {
  kind: AssetKind;
  common: CommonAssetForm;
  part: VariantTargetForm;
  items: VariantTargetForm[];
  shifter: ShifterSkinSetForm;
  skybox: SkyboxSkinSetForm;
  map: MapForm;
  customLogic: CustomLogicForm;
  addon: AddonForm;
}) {
  return (
    <aside className="grid content-start gap-3">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Review</h2>
      <div className="grid gap-3 border border-border bg-card/50 p-4">
        <SummaryRow label="Type" value={formatLabel(kind)} />
        <SummaryRow label="Title" value={common.title.trim() || "Untitled Asset"} />
        <SummaryRow label="Short Description" value={common.shortDescription.trim() || "None"} />
        <SummaryRow label="Media" value={`${mediaUrls(common).length} URL${mediaUrls(common).length === 1 ? "" : "s"}`} />
        <SummaryRow label="Tags" value={splitList(common.tags).join(", ") || "None"} />
        <SummaryRow label="Asset Data" value={reviewDataSummary(kind, part, items, shifter, skybox, map, customLogic, addon)} />
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}
