"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Textarea } from "@aottg2/ui";
import { Bold, Code, Heading, Italic, Link as LinkIcon, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ElementRef, FormEvent, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { assetPath, createAsset, getVariantCatalog, setCreatorName, type VariantCatalog } from "../lib/api/workshop";
import { toast } from "../lib/toast";

type AssetKind = "skin_part" | "skin_set";
type WizardStep = "type" | "listing" | "data" | "description";
type VariantScope = "all" | "specific";

interface VariantTargetForm {
  slot: string;
  textureUrl: string;
  variantScope: VariantScope;
  variants: string;
}

const wizardSteps: { key: WizardStep; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "listing", label: "Listing" },
  { key: "data", label: "Data" },
  { key: "description", label: "Publish" },
];

const markdownComponents: Components = {
  h1: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h3: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h4: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h5: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h6: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  p: ({ children }) => <p className="mt-3 text-sm leading-6 text-muted-foreground">{children}</p>,
  a: ({ children, href }) => (
    <a className="font-semibold text-primary hover:underline" href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="mt-4 border-l-2 border-primary/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground">{children}</blockquote>,
  code: ({ children }) => <code className="bg-muted px-1 py-0.5 text-xs text-foreground">{children}</code>,
  pre: ({ children }) => <pre className="mt-4 overflow-auto bg-muted p-3 text-xs text-foreground">{children}</pre>,
  table: ({ children }) => <table className="mt-4 w-full border-collapse border border-border text-sm text-muted-foreground">{children}</table>,
  th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-foreground">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
  img: ({ alt, src }) => <img className="mt-4 max-h-[520px] w-full object-contain" src={src ?? ""} alt={alt ?? ""} loading="lazy" />,
};

const markdownTools = [
  { label: "Heading", icon: Heading, before: "# ", after: "", placeholder: "Heading" },
  { label: "Bold", icon: Bold, before: "**", after: "**", placeholder: "bold" },
  { label: "Italic", icon: Italic, before: "*", after: "*", placeholder: "italic" },
  { label: "Strikethrough", icon: Strikethrough, before: "~~", after: "~~", placeholder: "struck text" },
  { label: "Inline code", icon: Code, before: "`", after: "`", placeholder: "code" },
  { label: "Link", icon: LinkIcon, before: "[", after: "](https://example.com)", placeholder: "link" },
  { label: "Quote", icon: Quote, before: "> ", after: "", placeholder: "Quote" },
  { label: "Bulleted list", icon: List, before: "- ", after: "", placeholder: "List item" },
  { label: "Numbered list", icon: ListOrdered, before: "1. ", after: "", placeholder: "List item" },
];

const fallbackCatalog: VariantCatalog = {
  hairMale: Array.from({ length: 35 }, (_, i) => `HairM${i}`),
  hairFemale: Array.from({ length: 33 }, (_, i) => `HairF${i}`),
  costumeMale: Array.from({ length: 12 }, (_, i) => `CostumeM${i}`),
  costumeFemale: Array.from({ length: 11 }, (_, i) => `CostumeF${i}`),
  hat: ["HatNone", ...Array.from({ length: 17 }, (_, i) => `Hat${i}`)],
  head: ["HeadNone", ...Array.from({ length: 8 }, (_, i) => `Head${i}`)],
  back: ["BackNone", ...Array.from({ length: 8 }, (_, i) => `Back${i}`)],
  humanSkinParts: [
    "Hair",
    "Eye",
    "Glass",
    "Face",
    "Skin",
    "Costume",
    "Logo",
    "GearL",
    "GearR",
    "Gas",
    "Hoodie",
    "WeaponTrail",
    "Horse",
    "ThunderspearL",
    "ThunderspearR",
    "HookL",
    "HookLTiling",
    "HookR",
    "HookRTiling",
    "Hat",
    "Head",
    "Back",
    "Boots",
  ],
};

const httpUrl = z
  .string()
  .trim()
  .url("Use a valid URL")
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), "Use an http(s) URL");

const commonSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    assetSlug: z.string().trim().optional(),
    descriptionMarkdown: z.string().trim().optional(),
    shortDescription: z.string().trim().max(144, "Short description must be 144 characters or less").optional(),
    thumbnailUrl: z.string().trim(),
    galleryUrls: z.string().trim(),
    tags: z.string().trim().optional(),
  })
  .superRefine((common, ctx) => {
    const assetSlug = common.assetSlug?.trim();
    const normalizedAssetSlug = normalizeSlug(assetSlug);
    if (assetSlug && (!normalizedAssetSlug || normalizedAssetSlug.length > 120)) {
      ctx.addIssue({ code: "custom", path: ["assetSlug"], message: "Slug must include letters or numbers and stay under 120 characters" });
    }

    for (const [index, url] of mediaUrls(common).entries()) {
      const result = httpUrl.safeParse(url);
      if (!result.success) {
        ctx.addIssue({ code: "custom", path: [index === 0 ? "thumbnailUrl" : "galleryUrls"], message: "Media URLs must be valid http(s) URLs" });
      }
    }
  });

const itemSchema = z
  .object({
    slot: z.string().min(1, "Slot is required"),
    textureUrl: httpUrl,
    variantScope: z.enum(["all", "specific"]),
    variants: z.string().trim(),
  })
  .superRefine(validateVariants);

const skinPartSchema = commonSchema
  .extend({
    slot: z.string().min(1, "Slot is required"),
    textureUrl: httpUrl,
    variantScope: z.enum(["all", "specific"]),
    variants: z.string().trim(),
  })
  .superRefine(validateVariants);

const skinSetSchema = commonSchema.extend({
  items: z.array(itemSchema).min(1, "Add at least one set item"),
});

function validateVariants(value: { variantScope: VariantScope; variants: string }, ctx: z.RefinementCtx) {
  if (value.variantScope === "specific" && splitList(value.variants).length === 0) {
    ctx.addIssue({ code: "custom", path: ["variants"], message: "Choose or enter at least one variant" });
  }
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mediaUrls(common: { thumbnailUrl: string; galleryUrls: string }) {
  return [common.thumbnailUrl.trim(), ...splitList(common.galleryUrls)].filter(Boolean);
}

function mediaFromCommon(common: { thumbnailUrl: string; galleryUrls: string }) {
  return [
    ...(common.thumbnailUrl.trim() ? [{ kind: "thumbnail", url: common.thumbnailUrl.trim() }] : []),
    ...splitList(common.galleryUrls).map((url) => ({ kind: "gallery", url })),
  ];
}

function normalizeSlug(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function variantOptions(slot: string, catalog: VariantCatalog) {
  switch (slot) {
    case "Hair":
      return [...catalog.hairMale, ...catalog.hairFemale];
    case "Costume":
      return [...catalog.costumeMale, ...catalog.costumeFemale];
    case "Hat":
      return catalog.hat;
    case "Head":
      return catalog.head;
    case "Back":
      return catalog.back;
    case "Boots":
      return ["0", "1"];
    default:
      return [];
  }
}

function selectError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Fix the highlighted fields";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Create asset failed";
}

export function CreateAsset() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, refreshProfile, workshopUser } = useAuth();
  const { data: loadedCatalog } = useQuery({ queryKey: ["workshop", "variants"], queryFn: getVariantCatalog, staleTime: 60 * 60 * 1000 });
  const catalog = loadedCatalog ?? fallbackCatalog;
  const authorName = profile?.displayName ?? "You";
  const [kind, setKind] = useState<AssetKind>("skin_part");
  const [step, setStep] = useState<WizardStep>("type");
  const [common, setCommon] = useState({ title: "", assetSlug: "", shortDescription: "", descriptionMarkdown: "", thumbnailUrl: "", galleryUrls: "", tags: "" });
  const [part, setPart] = useState<VariantTargetForm>({ slot: "Hair", textureUrl: "", variantScope: "specific", variants: "HairM3" });
  const [items, setItems] = useState<VariantTargetForm[]>([{ slot: "Costume", textureUrl: "", variantScope: "specific", variants: "CostumeM5" }]);
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  const [creatorNameInput, setCreatorNameInput] = useState("");
  const [creatorNameAccepted, setCreatorNameAccepted] = useState(false);
  const [creatorNameBusy, setCreatorNameBusy] = useState(false);
  const [pendingAsset, setPendingAsset] = useState<unknown>(null);
  const stepIndex = wizardSteps.findIndex((item) => item.key === step);
  const normalizedCreatorName = normalizeSlug(creatorNameInput);
  const canSetCreatorName = Boolean(normalizedCreatorName) && normalizedCreatorName.length <= 32 && creatorNameAccepted && !creatorNameBusy;

  const mutation = useMutation({
    mutationFn: (asset: unknown) => {
      const token = getAccessToken();
      if (!token) throw new Error("Not logged in");
      return createAsset(token, asset);
    },
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({ queryKey: ["workshop", "assets"] });
      toast.success("Asset created", { description: "Your asset was published." });
      router.push(assetPath(asset));
    },
    onError: (nextError) => {
      toast.error("Could not create asset", { description: selectError(nextError), id: "create-asset-error" });
    },
  });

  function updateItem(index: number, patch: Partial<VariantTargetForm>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function validateStep() {
    if (step === "listing") commonSchema.parse(common);
    if (step === "data") {
      if (kind === "skin_part") itemSchema.parse(part);
      else z.array(itemSchema).min(1, "Add at least one set item").parse(items);
    }
    if (step === "description") buildAsset();
  }

  function goNext() {
    try {
      validateStep();
      setStep(wizardSteps[Math.min(stepIndex + 1, wizardSteps.length - 1)].key);
    } catch (nextError) {
      toast.error("Could not continue", { description: selectError(nextError), id: "create-asset-error" });
    }
  }

  function buildAsset() {
    if (kind === "skin_part") {
      const data = skinPartSchema.parse({ ...common, ...part });
      const assetSlug = normalizeSlug(data.assetSlug);
      return {
        type: "skin_part",
        title: data.title,
        ...(assetSlug ? { assetSlug } : {}),
        descriptionMarkdown: data.descriptionMarkdown,
        shortDescription: data.shortDescription,
        media: mediaFromCommon(data),
        payload: {
          category: "human",
          slot: data.slot,
          textureUrl: data.textureUrl,
          variantScope: data.variantScope,
          ...(data.variantScope === "specific" ? { variants: splitList(data.variants) } : {}),
        },
        tags: splitList(data.tags),
      };
    }

    const data = skinSetSchema.parse({ ...common, items });
    const assetSlug = normalizeSlug(data.assetSlug);
    return {
      type: "skin_set",
      title: data.title,
      ...(assetSlug ? { assetSlug } : {}),
      descriptionMarkdown: data.descriptionMarkdown,
      shortDescription: data.shortDescription,
      media: mediaFromCommon(data),
      payload: {
        category: "human",
        items: data.items.map((item) => ({
          slot: item.slot,
          textureUrl: item.textureUrl,
          variantScope: item.variantScope,
          ...(item.variantScope === "specific" ? { variants: splitList(item.variants) } : {}),
        })),
      },
      tags: splitList(data.tags),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stepIndex < wizardSteps.length - 1) {
      goNext();
      return;
    }

    try {
      const asset = buildAsset();
      if (!workshopUser?.creatorName) {
        setPendingAsset(asset);
        setCreatorDialogOpen(true);
        return;
      }

      mutation.mutate(asset);
    } catch (nextError) {
      toast.error("Could not create asset", { description: selectError(nextError), id: "create-asset-error" });
    }
  }

  async function confirmCreatorName() {
    const token = getAccessToken();
    if (!token) {
      toast.error("Could not set creator name", { description: "Sign in again before publishing." });
      return;
    }
    if (!canSetCreatorName) return;

    try {
      setCreatorNameBusy(true);
      await setCreatorName(token, normalizedCreatorName);
      await refreshProfile();
      setCreatorDialogOpen(false);
      setCreatorNameAccepted(false);
      setCreatorNameInput("");
      if (pendingAsset) {
        mutation.mutate(pendingAsset);
        setPendingAsset(null);
      }
    } catch (error) {
      toast.error("Could not set creator name", { description: error instanceof Error ? error.message : "Try another creator name." });
    } finally {
      setCreatorNameBusy(false);
    }
  }

  function updateCreatorDialogOpen(open: boolean) {
    if (creatorNameBusy) return;
    setCreatorDialogOpen(open);
    if (!open) setPendingAsset(null);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Publish Asset</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create a URL-backed skin part or embedded-texture skin set.</p>
      </header>

      <form className="grid gap-8" onSubmit={handleSubmit}>
        <nav className="grid gap-2 sm:grid-cols-4" aria-label="Publish steps">
          {wizardSteps.map((item, index) => (
            <button
              key={item.key}
              type="button"
              className={`workshop-control-free flex min-h-11 items-center gap-2 border px-3 text-left text-sm font-semibold uppercase transition-colors ${item.key === step ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"} ${index <= stepIndex ? "hover:text-primary" : "cursor-default opacity-60"}`}
              disabled={index > stepIndex}
              onClick={() => setStep(item.key)}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center border border-current text-xs">{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {step === "type" ? (
          <section className="grid gap-4 border-t border-border pt-6">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">Asset Type</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TypeChoice active={kind === "skin_part"} title="Skin Part" body="One texture for one human slot." onClick={() => setKind("skin_part")} />
              <TypeChoice active={kind === "skin_set"} title="Skin Set" body="Multiple embedded textures in one human set." onClick={() => setKind("skin_set")} />
            </div>
          </section>
        ) : null}

        {step === "listing" ? (
          <section className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid content-start gap-4">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Listing</h2>
              <Field label="Title">
                <Input className="h-10 text-sm" value={common.title} onChange={(event) => setCommon({ ...common, title: event.target.value })} />
              </Field>
              <Field label="Custom URL Slug (Optional)">
                <Input className="h-10 text-sm" placeholder={normalizeSlug(common.title) || "red-levi-hair"} value={common.assetSlug} onChange={(event) => setCommon({ ...common, assetSlug: event.target.value })} />
              </Field>
              <Field label="Short Description">
                <Textarea maxLength={144} value={common.shortDescription} onChange={(event) => setCommon({ ...common, shortDescription: event.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Thumbnail URL">
                  <Input className="h-10 text-sm" placeholder="https://i.imgur.com/thumb.png" value={common.thumbnailUrl} onChange={(event) => setCommon({ ...common, thumbnailUrl: event.target.value })} />
                </Field>
                <Field label="Tags">
                  <Input className="h-10 text-sm" placeholder="hair, levi, red" value={common.tags} onChange={(event) => setCommon({ ...common, tags: event.target.value })} />
                </Field>
              </div>
            </div>
            <ListingPreview kind={kind} common={common} authorName={authorName} />
          </section>
        ) : null}

        {step === "data" ? (
          kind === "skin_part" ? (
            <section className="grid gap-4 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skin Part Target</h2>
              <TargetFields value={part} onChange={setPart} catalog={catalog} texturePlaceholder="https://i.imgur.com/hair.png" />
            </section>
          ) : (
            <section className="grid gap-5 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skin Set Items</h2>
              {items.map((item, index) => (
                <div key={index} className="grid gap-4 border-l border-border pl-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Set item {index + 1}</h3>
                    {items.length > 1 ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <TargetFields value={item} onChange={(nextItem) => updateItem(index, nextItem)} catalog={catalog} texturePlaceholder="https://i.imgur.com/costume.png" />
                </div>
              ))}
              <div>
                <Button type="button" variant="secondary" onClick={() => setItems((current) => [...current, { slot: "Hair", textureUrl: "", variantScope: "specific", variants: "HairM3" }])}>
                  Add set item
                </Button>
              </div>
            </section>
          )
        ) : null}

        {step === "description" ? (
          <section className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid content-start gap-4">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Publish Preview</h2>
              <Field label="Gallery URLs">
                <Textarea
                  placeholder="https://i.imgur.com/preview-1.png&#10;https://i.imgur.com/preview-2.png"
                  value={common.galleryUrls}
                  onChange={(event) => setCommon({ ...common, galleryUrls: event.target.value })}
                />
              </Field>
              <GalleryPreview urls={mediaUrls(common)} title={common.title.trim() || "Untitled Asset"} />
              <MarkdownEditor value={common.descriptionMarkdown} onChange={(descriptionMarkdown) => setCommon({ ...common, descriptionMarkdown })} />
              <div className="border border-border bg-card/50 p-4 text-sm leading-6 text-foreground">
                {common.descriptionMarkdown.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {common.descriptionMarkdown}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">No post content yet.</p>
                )}
              </div>
            </div>
            <ReviewSummary kind={kind} common={common} part={part} items={items} />
          </section>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="ghost" onClick={() => router.push("/library")}>
            Cancel
          </Button>
          {stepIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep(wizardSteps[Math.max(stepIndex - 1, 0)].key)}>
              Back
            </Button>
          ) : null}
          <Button type="submit" disabled={mutation.isPending}>
            {stepIndex < wizardSteps.length - 1 ? "Next" : mutation.isPending ? "Creating…" : "Publish Asset"}
          </Button>
        </div>
      </form>

      <Dialog open={creatorDialogOpen} onOpenChange={updateCreatorDialogOpen}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogTitle>Set Creator Name Forever</DialogTitle>
            <DialogDescription>
              Choose carefully. Your creator name can only be set once because it becomes part of every asset link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Creator Name">
              <Input className="h-10 text-sm" value={creatorNameInput} maxLength={64} onChange={(event) => setCreatorNameInput(event.target.value)} />
            </Field>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox id="creator-name-forever" checked={creatorNameAccepted} onCheckedChange={(checked) => setCreatorNameAccepted(checked === true)} />
              <Label htmlFor="creator-name-forever" className="leading-5">
                I understand this creator name is permanent.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={creatorNameBusy} onClick={() => updateCreatorDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={!canSetCreatorName} onClick={() => void confirmCreatorName()}>
              {creatorNameBusy ? "Saving..." : "Set Forever And Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TypeChoice({ active, title, body, onClick }: { active: boolean; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" className={`workshop-control-free grid min-h-36 gap-3 border p-5 text-left transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/40 hover:border-primary/60"}`} onClick={onClick}>
      <span className="font-primary text-2xl font-semibold uppercase leading-none">{title}</span>
      <span className="text-sm text-muted-foreground">{body}</span>
    </button>
  );
}

function ListingPreview({ kind, common, authorName }: { kind: AssetKind; common: { title: string; shortDescription: string; thumbnailUrl: string; tags: string }; authorName: string }) {
  const title = common.title.trim() || "Untitled Asset";
  const tags = splitList(common.tags).slice(0, 3);
  return (
    <aside className="grid content-start gap-3">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Card Preview</h2>
      <article className="grid overflow-hidden border border-border bg-card/60">
        <CardPreviewImage url={common.thumbnailUrl.trim()} title={title} />
        <div className="flex min-h-40 flex-col gap-2 p-3">
          <div className="line-clamp-1 text-sm text-foreground">
            <span className="font-primary font-semibold uppercase">{title}</span> <span className="font-normal text-muted-foreground">by {authorName}</span>
          </div>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{common.shortDescription.trim() || formatLabel(kind)}</p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            <Tag>{formatLabel(kind)}</Tag>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 pt-3 text-xs font-semibold uppercase text-muted-foreground">
            <span>0 downloads</span>
            <span>0 thanks</span>
          </div>
        </div>
      </article>
    </aside>
  );
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

function GalleryPreview({ urls, title }: { urls: string[]; title: string }) {
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

function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex min-h-7 items-center border border-border bg-muted/40 px-2 text-xs font-semibold uppercase text-muted-foreground">{children}</span>;
}

function ReviewSummary({ kind, common, part, items }: { kind: AssetKind; common: { title: string; shortDescription: string; thumbnailUrl: string; galleryUrls: string; tags: string }; part: VariantTargetForm; items: VariantTargetForm[] }) {
  return (
    <aside className="grid content-start gap-3">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">Review</h2>
      <div className="grid gap-3 border border-border bg-card/50 p-4">
        <SummaryRow label="Type" value={formatLabel(kind)} />
        <SummaryRow label="Title" value={common.title.trim() || "Untitled Asset"} />
        <SummaryRow label="Short Description" value={common.shortDescription.trim() || "None"} />
        <SummaryRow label="Media" value={`${mediaUrls(common).length} URL${mediaUrls(common).length === 1 ? "" : "s"}`} />
        <SummaryRow label="Tags" value={splitList(common.tags).join(", ") || "None"} />
        <SummaryRow label="Asset Data" value={kind === "skin_part" ? `${part.slot} - ${part.variantScope}` : `${items.length} set item${items.length === 1 ? "" : "s"}`} />
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

function MarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const textareaRef = useRef<ElementRef<typeof Textarea>>(null);

  function insertMarkup(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    const nextStart = start + before.length;
    const nextEnd = nextStart + selected.length;

    onChange(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <Label className="grid gap-0 text-sm font-medium">
      Post Content
      <div className="mt-2 flex flex-wrap items-center gap-1 border border-input border-b-0 bg-muted/40 px-2 py-1" aria-label="Post content formatting toolbar">
        {markdownTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button key={tool.label} type="button" variant="ghost" size="icon" static onClick={() => insertMarkup(tool.before, tool.after, tool.placeholder)} className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
              <Icon className="h-4 w-4" />
              <span className="sr-only">{tool.label}</span>
            </Button>
          );
        })}
      </div>
      <Textarea ref={textareaRef} className="min-h-64 border-t-0 focus-visible:ring-offset-0" value={value} onChange={(event) => onChange(event.target.value)} />
    </Label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </Label>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TargetFields({
  value,
  onChange,
  catalog,
  texturePlaceholder,
}: {
  value: VariantTargetForm;
  onChange: (value: VariantTargetForm) => void;
  catalog: VariantCatalog;
  texturePlaceholder: string;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slot">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={value.slot} onChange={(event) => onChange({ ...value, slot: event.target.value })}>
            {catalog.humanSkinParts.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Texture URL">
          <Input className="h-10 text-sm" placeholder={texturePlaceholder} value={value.textureUrl} onChange={(event) => onChange({ ...value, textureUrl: event.target.value })} />
        </Field>
      </div>
      <VariantFields value={value} onChange={onChange} options={variantOptions(value.slot, catalog)} />
    </>
  );
}

function VariantFields({ value, onChange, options }: { value: VariantTargetForm; onChange: (value: VariantTargetForm) => void; options: string[] }) {
  const selected = splitList(value.variants);

  function addVariant(variant: string) {
    if (!variant || selected.includes(variant)) return;
    onChange({ ...value, variants: [...selected, variant].join(", ") });
  }

  function removeVariant(variant: string) {
    onChange({ ...value, variants: selected.filter((item) => item !== variant).join(", ") });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Variant Scope">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={value.variantScope} onChange={(event) => onChange({ ...value, variantScope: event.target.value as VariantScope })}>
            <option value="all">All</option>
            <option value="specific">Specific</option>
          </select>
        </Field>
        <Field label="Choose Variant">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" disabled={value.variantScope === "all" || options.length === 0} value="" onChange={(event) => addVariant(event.target.value)}>
            <option value="">{options.length ? "Select one" : "No preset variants"}</option>
            {options.map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Selected / Custom Variants">
        <Input className="h-10 text-sm" placeholder="Pick above or type custom, comma-separated" value={value.variants} disabled={value.variantScope === "all"} onChange={(event) => onChange({ ...value, variants: event.target.value })} />
      </Field>
      {value.variantScope === "specific" && selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((variant) => (
            <button key={variant} type="button" className="min-h-10 rounded-full bg-primary/15 px-3 text-xs font-semibold text-primary transition-transform active:scale-[0.96]" onClick={() => removeVariant(variant)}>
              {variant} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
