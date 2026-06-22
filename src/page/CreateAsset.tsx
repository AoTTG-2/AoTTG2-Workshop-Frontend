import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Textarea } from "@aottg2/ui";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { getAccessToken } from "../auth/storage";
import { createAsset, getVariantCatalog, type VariantCatalog } from "../lib/api/workshop";
import { toast } from "../lib/toast";

type AssetKind = "skin_part" | "skin_set";
type VariantScope = "all" | "specific";

interface VariantTargetForm {
  slot: string;
  textureUrl: string;
  variantScope: VariantScope;
  variants: string;
}

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
    descriptionMarkdown: z.string().trim().optional(),
    shortDescription: z.string().trim().max(144, "Short description must be 144 characters or less").optional(),
    thumbnailUrl: z.string().trim(),
    galleryUrls: z.string().trim(),
    tags: z.string().trim().optional(),
  })
  .superRefine((common, ctx) => {
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: loadedCatalog } = useQuery({ queryKey: ["workshop", "variants"], queryFn: getVariantCatalog, staleTime: 60 * 60 * 1000 });
  const catalog = loadedCatalog ?? fallbackCatalog;
  const [kind, setKind] = useState<AssetKind>("skin_part");
  const [common, setCommon] = useState({ title: "", shortDescription: "", descriptionMarkdown: "", thumbnailUrl: "", galleryUrls: "", tags: "" });
  const [part, setPart] = useState<VariantTargetForm>({ slot: "Hair", textureUrl: "", variantScope: "specific", variants: "HairM3" });
  const [items, setItems] = useState<VariantTargetForm[]>([{ slot: "Costume", textureUrl: "", variantScope: "specific", variants: "CostumeM5" }]);

  const mutation = useMutation({
    mutationFn: (asset: unknown) => {
      const token = getAccessToken();
      if (!token) throw new Error("Not logged in");
      return createAsset(token, asset);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workshop", "assets"] });
      toast.success("Asset created", { description: "Your asset was saved and the marketplace will refresh." });
      navigate("/marketplace");
    },
    onError: (nextError) => {
      toast.error("Could not create asset", { description: selectError(nextError), id: "create-asset-error" });
    },
  });

  function updateItem(index: number, patch: Partial<VariantTargetForm>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function buildAsset() {
    if (kind === "skin_part") {
      const data = skinPartSchema.parse({ ...common, ...part });
      return {
        type: "skin_part",
        title: data.title,
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
    return {
      type: "skin_set",
      title: data.title,
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
    try {
      mutation.mutate(buildAsset());
    } catch (nextError) {
      toast.error("Could not create asset", { description: selectError(nextError), id: "create-asset-error" });
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <header className="mb-8">
        <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Add Asset</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Create a standalone skin part or an embedded-texture skin set.</p>
      </header>

      <form className="grid gap-8" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant={kind === "skin_part" ? "default" : "ghost"} onClick={() => setKind("skin_part")}>
            Skin Part
          </Button>
          <Button type="button" variant={kind === "skin_set" ? "default" : "ghost"} onClick={() => setKind("skin_set")}>
            Skin Set
          </Button>
        </div>

        <section className="grid gap-4 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Asset Details</h2>
          <Field label="Title">
            <Input className="h-10 text-sm" value={common.title} onChange={(event) => setCommon({ ...common, title: event.target.value })} />
          </Field>
          <Field label="Short Description">
            <Textarea maxLength={144} value={common.shortDescription} onChange={(event) => setCommon({ ...common, shortDescription: event.target.value })} />
          </Field>
          <Field label="Description Markdown">
            <Textarea value={common.descriptionMarkdown} onChange={(event) => setCommon({ ...common, descriptionMarkdown: event.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thumbnail URL">
              <Input className="h-10 text-sm" placeholder="https://i.imgur.com/thumb.png" value={common.thumbnailUrl} onChange={(event) => setCommon({ ...common, thumbnailUrl: event.target.value })} />
            </Field>
            <Field label="Tags">
              <Input className="h-10 text-sm" placeholder="hair, levi, red" value={common.tags} onChange={(event) => setCommon({ ...common, tags: event.target.value })} />
            </Field>
          </div>
          <Field label="Gallery URLs">
            <Textarea
              placeholder="https://i.imgur.com/preview-1.png&#10;https://i.imgur.com/preview-2.png"
              value={common.galleryUrls}
              onChange={(event) => setCommon({ ...common, galleryUrls: event.target.value })}
            />
          </Field>
        </section>

        {kind === "skin_part" ? (
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
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="ghost" onClick={() => navigate("/marketplace")}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create Asset"}
          </Button>
        </div>
      </form>
    </main>
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
