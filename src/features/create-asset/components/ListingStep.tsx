import { Input, Textarea } from "@aottg2/ui";
import type { AssetKind, CommonAssetForm, SkinCategory } from "../types";
import { normalizeSlug, splitList } from "../form-utils";
import { Field } from "./Field";
import { ListingPreview } from "./ListingPreview";
import { TagPicker } from "./TagPicker";

export function ListingStep({ authorName, common, isEdit, kind, setCommon, skinCategory }: { authorName: string; common: CommonAssetForm; isEdit: boolean; kind: AssetKind; setCommon: (common: CommonAssetForm) => void; skinCategory: SkinCategory }) {
  return (
    <section className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-4">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Listing</h2>
        <Field label="Title"><Input className="h-10 text-sm" value={common.title} onChange={(event) => setCommon({ ...common, title: event.target.value })} /></Field>
        <Field label={isEdit ? "URL Slug" : "Custom URL Slug (Optional)"}>
          <Input className="h-10 text-sm" disabled={isEdit} placeholder={normalizeSlug(common.title) || "red-levi-hair"} value={common.assetSlug} onChange={(event) => setCommon({ ...common, assetSlug: event.target.value })} />
        </Field>
        <Field label="Short Description"><Textarea maxLength={144} value={common.shortDescription} onChange={(event) => setCommon({ ...common, shortDescription: event.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Thumbnail URL *">
            <Input className="h-10 text-sm" placeholder="https://i.imgur.com/thumb.png" value={common.thumbnailUrl} onChange={(event) => setCommon({ ...common, thumbnailUrl: event.target.value })} />
            <p className="text-xs text-muted-foreground">Required for publishing.</p>
          </Field>
          <Field label="Tags">
            <TagPicker value={splitList(common.tags)} onChange={(tags) => setCommon({ ...common, tags: tags.join(", ") })} />
            <p className="text-xs text-muted-foreground">Add up to 8 tags.</p>
          </Field>
        </div>
      </div>
      <ListingPreview kind={kind} skinCategory={skinCategory} common={common} authorName={authorName} />
    </section>
  );
}
