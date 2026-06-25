import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@aottg2/ui";
import { markdownComponents } from "../markdown";
import { splitList } from "../form-utils";
import type { AssetKind, CommonAssetForm, ShifterSkinSetForm, SkyboxSkinSetForm, VariantTargetForm } from "../types";
import { Field } from "./Field";
import { GalleryPreview } from "./ListingPreview";
import { MarkdownEditor } from "./MarkdownEditor";
import { ReviewSummary } from "./ReviewSummary";

export function DescriptionStep({ common, items, kind, part, setCommon, shifter, skybox }: { common: CommonAssetForm; items: VariantTargetForm[]; kind: AssetKind; part: VariantTargetForm; setCommon: (common: CommonAssetForm) => void; shifter: ShifterSkinSetForm; skybox: SkyboxSkinSetForm }) {
  return (
    <section className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-4">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Publish Preview</h2>
        <Field label="Gallery URLs *">
          <Textarea placeholder="https://i.imgur.com/preview-1.png&#10;https://i.imgur.com/preview-2.png" value={common.galleryUrls} onChange={(event) => setCommon({ ...common, galleryUrls: event.target.value })} />
          <p className="text-xs text-muted-foreground">Add at least one image URL.</p>
        </Field>
        <GalleryPreview urls={splitList(common.galleryUrls)} title={common.title.trim() || "Untitled Asset"} />
        <MarkdownEditor value={common.descriptionMarkdown} onChange={(descriptionMarkdown) => setCommon({ ...common, descriptionMarkdown })} />
        <div className="border border-border bg-card/50 p-4 text-sm leading-6 text-foreground">
          {common.descriptionMarkdown.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{common.descriptionMarkdown}</ReactMarkdown> : <p className="text-muted-foreground">No post content yet.</p>}
        </div>
      </div>
      <ReviewSummary kind={kind} common={common} part={part} items={items} shifter={shifter} skybox={skybox} />
    </section>
  );
}
