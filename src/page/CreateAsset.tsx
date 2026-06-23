"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Spinner, Textarea } from "@aottg2/ui";
import { Backpack, Badge, Bold, Cable, Cloud, Code, Code2, Cog, Crown, Eye, Flag, Footprints, Glasses, Hand, Heading, Image as ImageIcon, Italic, Link as LinkIcon, List, ListOrdered, Map, Palette, Quote, Rocket, Search, Shield, Shirt, Smile, Sparkles, Strikethrough, UserRound, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ElementRef, FormEvent, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { canModerateAssets } from "../auth/workshopPermissions";
import { assetPath, createAsset, getVariantCatalog, listAssets, setCreatorName, updateAsset, type SkinPartPayload, type SkinSetPayload, type VariantCatalog, type WorkshopAsset, type WorkshopVariantOption } from "../lib/api/workshop";
import { WORKSHOP_STATIC_API_ORIGIN } from "../lib/config";
import { toast } from "../lib/toast";
import { SideCard } from "../components/SideCard";
import { WorkshopAssetCard } from "../components/WorkshopAssetCard";

type AssetKind = "skin_part" | "skin_set";
type WizardStep = "type" | "listing" | "data" | "description";

interface VariantTargetForm {
  slot: string;
  source?: "url" | "asset";
  skinAssetId?: string | null;
  linkedAsset?: WorkshopAsset | null;
  textureUrl: string;
  variants: string[];
  hookTiling?: string;
  boots?: boolean;
}

const wizardSteps: { key: WizardStep; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "data", label: "Texture" },
  { key: "listing", label: "Listing" },
  { key: "description", label: "Publish" },
];
const editWizardSteps = wizardSteps.filter((step) => step.key !== "type");
const previewCreatedAt = new Date().toISOString();
const previewEngagement = {
  downloadCount: 152,
  likeCount: 41,
  favoriteCount: 18,
  viewCount: 640,
  commentCount: 7,
};
const cardMotionAnimate = { opacity: 1, y: 0 };

function cardMotionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y };
}

function cardMotionTransition(delay: number) {
  return { duration: 0.16, ease: "easeOut" as const, delay };
}

const skinTypeLabels: Record<string, string> = {
  Set: "Set",
  Eye: "Eyes",
  Glass: "Glasses",
  Skin: "Body Skin",
  Logo: "Cape Logo",
  GearL: "Left Gear",
  GearR: "Right Gear",
  Gas: "Gas Smoke",
  WeaponTrail: "Blade Trail",
  ThunderspearL: "Left Thunderspear",
  ThunderspearR: "Right Thunderspear",
  HookL: "Left Hook",
  HookR: "Right Hook",
  Hat: "Hat",
  Head: "Head Accessory",
  Back: "Back Accessory",
};

const pairedTilingSlots = new Set(["HookLTiling", "HookRTiling"]);

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
  ],
  humanCompatibilitySlots: ["Hair", "Costume", "Hat", "Head", "Back"],
  humanCompatibilityVariants: {
    Hair: [...Array.from({ length: 35 }, (_, i) => `HairM${i}`), ...Array.from({ length: 33 }, (_, i) => `HairF${i}`)].map(toCatalogOption),
    Costume: [...Array.from({ length: 12 }, (_, i) => `CostumeM${i}`), ...Array.from({ length: 11 }, (_, i) => `CostumeF${i}`)].map(toCatalogOption),
    Hat: Array.from({ length: 17 }, (_, i) => `Hat${i}`).map(toCatalogOption),
    Head: Array.from({ length: 8 }, (_, i) => `Head${i}`).map(toCatalogOption),
    Back: Array.from({ length: 8 }, (_, i) => `Back${i}`).map(toCatalogOption),
  },
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
    variants: z.array(z.string()),
    hookTiling: z.string().trim().optional(),
    boots: z.boolean().optional(),
  });

const skinPartSchema = commonSchema
  .extend({
    slot: z.string().min(1, "Slot is required"),
    textureUrl: httpUrl,
    variants: z.array(z.string()),
    hookTiling: z.string().trim().optional(),
    boots: z.boolean().optional(),
  });

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

function toCatalogOption(id: string): WorkshopVariantOption {
  return { id, label: id, previewUrl: `/workshop/catalog/human/previews/${id}.webp` };
}

function compatibilityVariantOptions(slot: string, catalog: VariantCatalog) {
  return catalog.humanCompatibilityVariants?.[slot] ?? [];
}

function isCompatibilitySlot(slot: string, catalog: VariantCatalog) {
  return catalog.humanCompatibilitySlots?.includes(slot) ?? compatibilityVariantOptions(slot, catalog).length > 0;
}

function isHookSlot(slot: string) {
  return slot === "HookL" || slot === "HookR";
}

function isCostumeSlot(slot: string) {
  return slot === "Costume";
}

function targetSlotPatch(value: VariantTargetForm, slot: string) {
  return { ...value, slot, skinAssetId: null, linkedAsset: null, variants: [], hookTiling: isHookSlot(slot) ? value.hookTiling || "1" : undefined, boots: isCostumeSlot(slot) ? value.boots ?? true : undefined };
}

function hookTilingSlot(slot: string) {
  return slot === "HookL" ? "HookLTiling" : "HookRTiling";
}

function hookTilingPayload(value: { slot: string; hookTiling?: string }) {
  if (!isHookSlot(value.slot)) return {};
  const tiling = Number(value.hookTiling || "1");
  if (!Number.isFinite(tiling) || tiling <= 0) {
    throw new Error(`${skinTypeLabel(value.slot)} tiling must be greater than 0`);
  }
  return { tilingSlot: hookTilingSlot(value.slot), tiling };
}

function bootsPayload(value: { slot: string; boots?: boolean }) {
  return isCostumeSlot(value.slot) ? { boots: value.boots ?? true } : {};
}

function prepareTarget(value: VariantTargetForm, catalog: VariantCatalog) {
  const data = itemSchema.parse(value);
  if (!isCompatibilitySlot(data.slot, catalog)) {
    return { slot: data.slot, textureUrl: data.textureUrl, variantScope: "all" as const, ...hookTilingPayload(data) };
  }

  const allowed = new Set(compatibilityVariantOptions(data.slot, catalog).map((option) => option.id));
  const variants = data.variants.filter((variant) => allowed.has(variant));
  if (variants.length === 0) {
    throw new Error(`Choose at least one compatible model for ${skinTypeLabel(data.slot)}`);
  }

  return { slot: data.slot, textureUrl: data.textureUrl, variantScope: "specific" as const, variants, ...bootsPayload(data) };
}

function prepareSetItem(value: VariantTargetForm, catalog: VariantCatalog) {
  if (value.source === "asset" || value.skinAssetId) {
    if (!value.slot) throw new Error("Slot is required");
    if (!value.skinAssetId) throw new Error(`Choose a ${skinTypeLabel(value.slot)} asset`);
    return { slot: value.slot, skinAssetId: value.skinAssetId, textureUrl: null, variantScope: null, variants: null };
  }

  return prepareTarget(value, catalog);
}

function previewUrl(path: string | null | undefined) {
  return path ? `${WORKSHOP_STATIC_API_ORIGIN}${path}` : "";
}

function variantNumber(id: string) {
  return id.match(/(\d+)$/)?.[1] ?? "";
}

function variantGroup(id: string) {
  if (/^[A-Za-z]+M\d+$/.test(id)) return "Male";
  if (/^[A-Za-z]+F\d+$/.test(id)) return "Female";
  return "";
}

function variantDisplayLabel(option: WorkshopVariantOption) {
  const group = variantGroup(option.id);
  const number = variantNumber(option.id);
  if (group && number) return `${group} ${number}`;

  const prefix = option.id.replace(/\d+$/, "");
  return number ? `${prefix} ${number}` : option.label || option.id;
}

function selectedVariantOptions(value: VariantTargetForm, catalog: VariantCatalog) {
  const options = compatibilityVariantOptions(value.slot, catalog);
  return value.variants.map((variant) => options.find((option) => option.id === variant) ?? toCatalogOption(variant));
}

function targetTitle(value: VariantTargetForm, catalog: VariantCatalog) {
  const label = skinTypeLabel(value.slot);
  if (!isCompatibilitySlot(value.slot, catalog)) return label;
  const selected = selectedVariantOptions(value, catalog);
  if (selected.length === 0) return `${label} - Choose Models`;
  if (selected.length === 1) return `${label} - ${variantDisplayLabel(selected[0])}`;
  return `${label} - ${selected.length} Models`;
}

function bootsLabel(value: { slot?: string; boots?: boolean | null }) {
  return value.slot === "Costume" ? `Boots ${value.boots === false ? "Off" : "On"}` : "";
}

function skinPartSlot(asset: WorkshopAsset) {
  return asset.type === "skin_part" && "slot" in asset.payload && typeof asset.payload.slot === "string" ? asset.payload.slot : "";
}

function isEditableAsset(asset: WorkshopAsset | null | undefined): asset is WorkshopAsset & { type: AssetKind } {
  return asset?.type === "skin_part" || asset?.type === "skin_set";
}

function commonFromAsset(asset: WorkshopAsset | null | undefined) {
  const thumbnail = asset?.media.find((item) => item.kind === "thumbnail")?.url ?? "";
  const galleryUrls = asset?.media.filter((item) => item.kind === "gallery").map((item) => item.url).join("\n") ?? "";
  return {
    title: asset?.title ?? "",
    assetSlug: asset?.assetSlug ?? "",
    shortDescription: asset?.shortDescription ?? "",
    descriptionMarkdown: asset?.descriptionMarkdown ?? "",
    thumbnailUrl: thumbnail,
    galleryUrls,
    tags: asset?.tags.join(", ") ?? "",
  };
}

function targetFromSkinPart(payload: SkinPartPayload | Record<string, unknown>): VariantTargetForm {
  const data = payload as SkinPartPayload;
  return {
    source: "url",
    slot: data.slot || "Hair",
    textureUrl: data.textureUrl || "",
    variants: Array.isArray(data.variants) ? data.variants : [],
    boots: data.slot === "Costume" ? data.boots ?? true : undefined,
  };
}

function displayTargetFromAsset(asset: WorkshopAsset): VariantTargetForm {
  return targetFromSkinPart(asset.payload);
}

function targetsFromSkinSet(payload: SkinSetPayload | Record<string, unknown>): VariantTargetForm[] {
  const items = (payload as SkinSetPayload).items;
  if (!Array.isArray(items) || items.length === 0) return [{ slot: "Costume", textureUrl: "", variants: [], boots: true }];
  return items.map((item) => ({
    source: item.skinAssetId ? "asset" : "url",
    slot: item.slot || "Hair",
    skinAssetId: item.skinAssetId ?? null,
    textureUrl: item.textureUrl || "",
    variants: Array.isArray(item.variants) ? item.variants : [],
    boots: item.slot === "Costume" ? item.boots ?? true : undefined,
  }));
}

function updatePayloadFromAssetForm(asset: unknown) {
  const patch = { ...(asset as Record<string, unknown>) };
  delete patch.type;
  delete patch.assetSlug;
  return patch;
}

function skinTypeLabel(slot: string) {
  return skinTypeLabels[slot] ?? slot;
}

function skinTypeIcon(slot: string) {
  if (slot === "Set") return <Sparkles className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Hair") return <UserRound className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Costume") return <Shirt className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Eye") return <Eye className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Glass") return <Glasses className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Face") return <Smile className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Skin") return <Hand className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Logo") return <Flag className="h-5 w-5" aria-hidden="true" />;
  if (slot === "GearL" || slot === "GearR") return <Cog className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Gas") return <Cloud className="h-5 w-5" aria-hidden="true" />;
  if (slot === "WeaponTrail") return <Zap className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Horse") return <Shield className="h-5 w-5" aria-hidden="true" />;
  if (slot === "ThunderspearL" || slot === "ThunderspearR") return <Rocket className="h-5 w-5" aria-hidden="true" />;
  if (slot === "HookL" || slot === "HookR") return <Cable className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Hat") return <Crown className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Head") return <Badge className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Back") return <Backpack className="h-5 w-5" aria-hidden="true" />;
  return <Palette className="h-5 w-5" aria-hidden="true" />;
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

export function CreateAsset({ mode = "create", initialAsset = null }: { mode?: "create" | "edit"; initialAsset?: WorkshopAsset | null } = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, profile, refreshProfile, workshopUser } = useAuth();
  const { data: loadedCatalog } = useQuery({ queryKey: ["workshop", "variants"], queryFn: getVariantCatalog, staleTime: 60 * 60 * 1000 });
  const catalog = loadedCatalog ?? fallbackCatalog;
  const isEdit = mode === "edit";
  const steps = isEdit ? editWizardSteps : wizardSteps;
  const editableAsset = isEditableAsset(initialAsset) ? initialAsset : null;
  const authorName = profile?.displayName ?? "You";
  const [kind, setKind] = useState<AssetKind>(() => (editableAsset?.type === "skin_set" ? "skin_set" : "skin_part"));
  const [step, setStep] = useState<WizardStep>(() => (isEdit ? "listing" : "type"));
  const [common, setCommon] = useState(() => commonFromAsset(editableAsset));
  const [part, setPart] = useState<VariantTargetForm>(() => (editableAsset?.type === "skin_part" ? targetFromSkinPart(editableAsset.payload) : { slot: "Hair", textureUrl: "", variants: [] }));
  const [items, setItems] = useState<VariantTargetForm[]>(() => (editableAsset?.type === "skin_set" ? targetsFromSkinSet(editableAsset.payload) : [{ slot: "Costume", textureUrl: "", variants: [], boots: true }]));
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  const [creatorNameInput, setCreatorNameInput] = useState("");
  const [creatorNameAccepted, setCreatorNameAccepted] = useState(false);
  const [creatorNameBusy, setCreatorNameBusy] = useState(false);
  const [pendingAsset, setPendingAsset] = useState<unknown>(null);
  const stepIndex = Math.max(steps.findIndex((item) => item.key === step), 0);
  const normalizedCreatorName = normalizeSlug(creatorNameInput);
  const canSetCreatorName = Boolean(normalizedCreatorName) && normalizedCreatorName.length <= 32 && creatorNameAccepted && !creatorNameBusy;
  const humanPartChoices = catalog.humanSkinParts.filter((slot) => slot && !pairedTilingSlots.has(slot));
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const permissionSource = workshopUser ?? profile;
  const canEditAsset = !isEdit || Boolean(editableAsset && isAuthenticated && (accountId === editableAsset.ownerAuthAccountId || canModerateAssets(permissionSource)));
  const cancelPath = editableAsset ? assetPath(editableAsset) : "/library";

  const mutation = useMutation({
    mutationFn: (asset: unknown) => {
      const token = getAccessToken();
      if (!token) throw new Error("Not logged in");
      if (isEdit) {
        if (!editableAsset) throw new Error("This asset type cannot be edited yet.");
        return updateAsset(token, editableAsset.publicId || editableAsset.id, asset);
      }
      return createAsset(token, asset);
    },
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({ queryKey: ["workshop", "assets"] });
      void queryClient.invalidateQueries({ queryKey: ["workshop", "asset"] });
      toast.success(isEdit ? "Asset updated" : "Asset created", { description: isEdit ? "Your changes were saved." : "Your asset was published." });
      router.push(assetPath(asset));
    },
    onError: (nextError) => {
      toast.error(isEdit ? "Could not update asset" : "Could not create asset", { description: selectError(nextError), id: "create-asset-error" });
    },
  });

  function updateItem(index: number, patch: Partial<VariantTargetForm>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function validateStep() {
    if (step === "listing") commonSchema.parse(common);
    if (step === "data") {
      if (kind === "skin_part") prepareTarget(part, catalog);
      else {
        if (items.length === 0) throw new Error("Add at least one set item");
        items.forEach((item) => prepareSetItem(item, catalog));
      }
    }
    if (step === "description") buildAsset();
  }

  function goNext() {
    try {
      validateStep();
      setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].key);
    } catch (nextError) {
      toast.error("Could not continue", { description: selectError(nextError), id: "create-asset-error" });
    }
  }

  function buildAsset() {
    if (kind === "skin_part") {
      const data = skinPartSchema.parse({ ...common, ...part });
      const target = prepareTarget(data, catalog);
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
          ...target,
        },
        tags: splitList(data.tags),
      };
    }

    const data = commonSchema.parse(common);
    if (items.length === 0) throw new Error("Add at least one set item");
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
        items: items.map((item) => prepareSetItem(item, catalog)),
      },
      tags: splitList(data.tags),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stepIndex < steps.length - 1) {
      goNext();
      return;
    }

    try {
      const asset = buildAsset();
      if (isEdit) {
        mutation.mutate(updatePayloadFromAssetForm(asset));
        return;
      }

      if (!workshopUser?.creatorName) {
        setPendingAsset(asset);
        setCreatorDialogOpen(true);
        return;
      }

      mutation.mutate(asset);
    } catch (nextError) {
      toast.error(isEdit ? "Could not update asset" : "Could not create asset", { description: selectError(nextError), id: "create-asset-error" });
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

  if (isEdit && !editableAsset) {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-3xl place-items-center px-6 py-8">
        <SideCard title="Editing Unavailable" variant="secondary">
          <p className="text-sm text-muted-foreground">This asset type cannot be edited in the Workshop form yet.</p>
          <Button type="button" className="mt-4" onClick={() => router.push("/library")}>
            Back to library
          </Button>
        </SideCard>
      </main>
    );
  }

  if (isEdit && isLoading) {
    return (
      <main className="grid min-h-[calc(100vh-120px)] place-items-center">
        <Spinner size="lg" variant="primary" label="Checking access" />
      </main>
    );
  }

  if (isEdit && !canEditAsset) {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-3xl place-items-center px-6 py-8">
        <SideCard title="No Edit Access" variant="secondary">
          <p className="text-sm text-muted-foreground">Only the creator or a Workshop moderator can edit this asset.</p>
          <Button type="button" className="mt-4" onClick={() => router.push(cancelPath)}>
            Back to asset
          </Button>
        </SideCard>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">{isEdit ? "Edit Asset" : "Publish Asset"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{isEdit ? "Update the current listing, media URLs, and texture data." : "Create a URL-backed skin part or embedded-texture skin set."}</p>
      </header>

      <form className="grid gap-8" onSubmit={handleSubmit}>
        <nav className={`grid gap-2 ${isEdit ? "sm:grid-cols-3" : "sm:grid-cols-4"}`} aria-label={isEdit ? "Edit steps" : "Publish steps"}>
          {steps.map((item, index) => (
            <Button
              key={item.key}
              type="button"
              variant={item.key === step ? "default" : "ghost"}
              className={`min-h-11 justify-start border px-3 text-left text-sm font-semibold uppercase ${index > stepIndex ? "cursor-default opacity-60" : ""}`}
              disabled={index > stepIndex}
              onClick={() => setStep(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        {step === "type" ? (
          <section className="grid gap-6 border-t border-border pt-6">
            <SideCard title="Category" variant="secondary" contentClassName="grid auto-rows-fr gap-4 sm:grid-cols-3">
              <TypeChoice active icon={<Sparkles className="h-5 w-5" aria-hidden="true" />} title="Skins" body="Human texture assets and sets." onClick={() => undefined} />
              <TypeChoice disabled icon={<Map className="h-5 w-5" aria-hidden="true" />} title="Maps" body="Coming after backend support." onClick={() => undefined} />
              <TypeChoice disabled icon={<Code2 className="h-5 w-5" aria-hidden="true" />} title="Custom Logics" body="Coming after backend support." onClick={() => undefined} />
            </SideCard>
            <SideCard title="Skin Type" variant="secondary" contentClassName="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <TypeChoice
                  active={kind === "skin_set"}
                  icon={skinTypeIcon("Set")}
                  title={skinTypeLabel("Set")}
                  body="Publish multiple skin parts together. Add Hair, Eyes, Costume, Hooks, and other texture URLs in one asset."
                  onClick={() => setKind("skin_set")}
                />
              </div>
              {humanPartChoices.map((slot) => (
                <TypeChoice
                  key={slot}
                  active={kind === "skin_part" && part.slot === slot}
                  compact
                  icon={skinTypeIcon(slot)}
                  title={skinTypeLabel(slot)}
                  onClick={() => {
                    setKind("skin_part");
                    setPart((current) => targetSlotPatch(current, slot));
                  }}
                />
              ))}
            </SideCard>
          </section>
        ) : null}

        {step === "listing" ? (
          <section className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid content-start gap-4">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Listing</h2>
              <Field label="Title">
                <Input className="h-10 text-sm" value={common.title} onChange={(event) => setCommon({ ...common, title: event.target.value })} />
              </Field>
              <Field label={isEdit ? "URL Slug" : "Custom URL Slug (Optional)"}>
                <Input className="h-10 text-sm" disabled={isEdit} placeholder={normalizeSlug(common.title) || "red-levi-hair"} value={common.assetSlug} onChange={(event) => setCommon({ ...common, assetSlug: event.target.value })} />
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
              <SkinTargetCard value={part} onChange={setPart} catalog={catalog} texturePlaceholder="https://i.imgur.com/hair.png" />
            </section>
          ) : (
            <section className="grid gap-5 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skin Set Items</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((item, index) => (
                  <SkinTargetCard
                    key={index}
                    value={item}
                    onChange={(nextItem) => updateItem(index, nextItem)}
                    catalog={catalog}
                    texturePlaceholder="https://i.imgur.com/costume.png"
                    allowAssetSource
                    onRemove={items.length > 1 ? () => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index)) : undefined}
                  />
                ))}
              </div>
              <div>
                <Button type="button" variant="secondary" onClick={() => setItems((current) => [...current, { source: "url", slot: "Hair", textureUrl: "", variants: [] }])}>
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
              <GalleryPreview urls={splitList(common.galleryUrls)} title={common.title.trim() || "Untitled Asset"} />
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
          <Button type="button" variant="ghost" onClick={() => router.push(cancelPath)}>
            Cancel
          </Button>
          {stepIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep(steps[Math.max(stepIndex - 1, 0)].key)}>
              Back
            </Button>
          ) : null}
          <Button type="submit" disabled={mutation.isPending}>
            {stepIndex < steps.length - 1 ? "Next" : mutation.isPending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Publish Asset"}
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

function TypeChoice({ active = false, compact = false, disabled = false, icon, title, body, onClick }: { active?: boolean; compact?: boolean; disabled?: boolean; icon?: ReactNode; title: string; body?: string; onClick: () => void }) {
  const minHeight = body ? (compact ? "min-h-[76px]" : "min-h-[104px]") : compact ? "min-h-16" : "min-h-20";

  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      className={`group flex !h-auto w-full flex-col !items-start !justify-center gap-2 !overflow-visible !whitespace-normal px-4 py-4 text-left ${minHeight} ${active ? "aottg2-emboss-bg aottg2-cta-primary shadow-[0_3px_0_hsl(var(--primary)/0.45)]" : "bg-[color-mix(in_srgb,hsl(var(--input))_58%,hsl(var(--background)))] shadow-[inset_0_1px_5px_rgb(0_0_0_/_0.28),inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-foreground"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={`flex items-center gap-2 whitespace-normal font-primary font-semibold uppercase leading-none ${compact ? "text-xl" : "text-2xl"} ${active ? "text-primary-foreground" : "text-foreground group-hover:text-background"}`}>
        {icon}
        {title}
      </span>
      {body ? <span className={`block whitespace-normal text-sm leading-5 ${active ? "text-primary-foreground" : "text-foreground group-hover:text-background"}`}>{body}</span> : null}
    </Button>
  );
}

function ListingPreview({ kind, common, authorName }: { kind: AssetKind; common: { title: string; shortDescription: string; thumbnailUrl: string; tags: string }; authorName: string }) {
  const title = common.title.trim() || "Untitled Asset";
  const thumbnailUrl = common.thumbnailUrl.trim();
  const asset: WorkshopAsset = {
    id: "preview",
    publicId: "preview",
    creatorName: "preview",
    assetSlug: "preview",
    type: kind,
    title,
    shortDescription: common.shortDescription.trim() || null,
    descriptionMarkdown: null,
    media: thumbnailUrl ? [{ kind: "thumbnail", url: thumbnailUrl, description: title }] : [],
    payload: { category: "human" },
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

function TexturePreviewButton({ url, label, onClick }: { url: string; label: string; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  const cleanUrl = url.trim();

  useEffect(() => {
    setFailed(false);
  }, [cleanUrl]);

  if (!cleanUrl || failed) {
    return (
      <Button type="button" variant="ghost" className="flex !h-full min-h-40 w-full items-center justify-center gap-3 border border-border bg-muted/40 p-4 text-center text-foreground" onClick={onClick}>
        <ImageIcon className="h-6 w-6 shrink-0" />
        <span className="font-primary text-base font-semibold uppercase leading-none text-foreground">Set Texture URL</span>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" className="relative !h-full min-h-40 w-full overflow-hidden border border-border bg-muted/40 p-0" onClick={onClick}>
      <img className="absolute inset-0 h-full w-full object-contain" src={cleanUrl} alt={label} loading="lazy" onError={() => setFailed(true)} />
      <span className="sr-only">Change texture URL</span>
    </Button>
  );
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
        <SummaryRow label="Asset Data" value={kind === "skin_part" ? `${skinTypeLabel(part.slot)}${part.variants.length ? ` - ${part.variants.length} model${part.variants.length === 1 ? "" : "s"}` : ""}${bootsLabel(part) ? ` - ${bootsLabel(part)}` : ""}` : `${items.length} set item${items.length === 1 ? "" : "s"}`} />
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

function SkinTargetCard({
  value,
  onChange,
  catalog,
  texturePlaceholder,
  allowAssetSource = false,
  onRemove,
}: {
  value: VariantTargetForm;
  onChange: (value: VariantTargetForm) => void;
  catalog: VariantCatalog;
  texturePlaceholder: string;
  allowAssetSource?: boolean;
  onRemove?: () => void;
}) {
  const [slotOpen, setSlotOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [variantInitialPhase, setVariantInitialPhase] = useState<"models" | "boots">("models");
  const [textureOpen, setTextureOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const compatibilityOptions = compatibilityVariantOptions(value.slot, catalog);
  const needsCompatibility = isCompatibilitySlot(value.slot, catalog);
  const needsHookTiling = isHookSlot(value.slot);
  const selectedOptions = selectedVariantOptions(value, catalog);
  const isAssetSource = allowAssetSource && (value.source === "asset" || Boolean(value.skinAssetId));
  const cardTitle = isAssetSource ? `${value.linkedAsset?.title ?? skinTypeLabel(value.slot)} - Referenced Skin Part` : targetTitle(value, catalog);

  function selectSlot(slot: string) {
    onChange(targetSlotPatch(value, slot));
    setSlotOpen(false);
    if (isCompatibilitySlot(slot, catalog)) openVariantPicker();
  }

  function toggleVariant(variant: string) {
    onChange({ ...value, variants: value.variants.includes(variant) ? value.variants.filter((item) => item !== variant) : [...value.variants, variant] });
  }

  function openVariantPicker(phase: "models" | "boots" = "models") {
    setVariantInitialPhase(phase);
    setVariantOpen(true);
  }

  function selectAsset(asset: WorkshopAsset) {
    const slot = skinPartSlot(asset) || value.slot;
    const displayTarget = displayTargetFromAsset(asset);
    onChange({ ...targetSlotPatch(value, slot), ...displayTarget, source: "asset", skinAssetId: asset.id, linkedAsset: asset });
    setAssetOpen(false);
  }

  return (
    <SideCard
      title={
        <span className="flex h-4 items-center justify-between gap-3">
          <span className="min-w-0 truncate">{cardTitle}</span>
          {onRemove ? (
            <Button type="button" variant="ghost" className="!h-4 !min-h-4 w-4 shrink-0 p-0 font-primary text-sm leading-none text-primary-foreground hover:bg-transparent hover:text-primary-foreground/80" onClick={() => setRemoveOpen(true)}>
              X
            </Button>
          ) : null}
        </span>
      }
      className="border-l-4 border-l-primary"
      contentClassName="grid gap-4"
    >
      {allowAssetSource ? (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={!isAssetSource ? undefined : "secondary"} onClick={() => (isAssetSource ? onChange({ ...value, source: "url", skinAssetId: null, linkedAsset: null }) : undefined)}>
            Use URL
          </Button>
          <Button type="button" variant={isAssetSource ? undefined : "secondary"} onClick={() => (!isAssetSource ? onChange({ ...value, source: "asset", textureUrl: "", variants: [] }) : undefined)}>
            Use Asset
          </Button>
        </div>
      ) : null}

      <div className={`grid items-stretch gap-4 ${isAssetSource && !value.skinAssetId ? "" : "sm:grid-cols-[minmax(260px,1fr)_minmax(0,1fr)]"}`}>
        {isAssetSource ? (
          value.skinAssetId ? (
            <TexturePreviewPanel url={value.textureUrl} label={`${skinTypeLabel(value.slot)} texture`} />
          ) : (
            <SelectAssetButton slot={value.slot} onClick={() => setAssetOpen(true)} />
          )
        ) : (
          <TexturePreviewButton url={value.textureUrl} label={`${skinTypeLabel(value.slot)} texture`} onClick={() => setTextureOpen(true)} />
        )}
        <div className={`grid content-start gap-3 ${isAssetSource && !value.skinAssetId ? "hidden" : ""}`}>
          <Button type="button" variant="secondary" className="min-h-16 justify-between gap-3 px-3" disabled={isAssetSource} onClick={() => setSlotOpen(true)}>
            <span>{skinTypeLabel(value.slot)}</span>
            {skinTypeIcon(value.slot)}
          </Button>
          {needsCompatibility ? (
            <Button type="button" variant="secondary" className="min-h-16 justify-between gap-3 px-3" disabled={isAssetSource} onClick={() => openVariantPicker()}>
              <span>{selectedOptions.length === 1 ? variantDisplayLabel(selectedOptions[0]) : selectedOptions.length ? `${selectedOptions.length} Models` : "Choose Models"}</span>
              <span className="text-xs">{compatibilityOptions.length} available</span>
            </Button>
          ) : needsHookTiling ? (
            <Field label="Hook Tiling">
              <Input className="h-12 text-sm" min="0.01" step="0.01" type="number" value={value.hookTiling || "1"} onChange={(event) => onChange({ ...value, hookTiling: event.target.value })} />
            </Field>
          ) : (
            <Button type="button" variant="secondary" className="min-h-16 justify-start px-3" disabled>
              No Model Picker
            </Button>
          )}
        </div>
      </div>
      {needsCompatibility && (selectedOptions.length > 0 || isCostumeSlot(value.slot)) && (!isAssetSource || value.skinAssetId) ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => {
            const imageUrl = previewUrl(option.previewUrl);
            return (
              <Button key={option.id} type="button" variant="ghost" size="sm" className="min-h-8 gap-2 border border-border bg-primary/15 px-2 text-xs font-semibold text-primary" disabled={isAssetSource} onClick={() => toggleVariant(option.id)}>
                <span className="grid h-7 w-7 place-items-center overflow-hidden bg-muted/50">
                  {imageUrl ? <img className="h-full w-full object-contain" src={imageUrl} alt="" loading="lazy" /> : skinTypeIcon(value.slot)}
                </span>
                {variantDisplayLabel(option)}
              </Button>
            );
          })}
          {isCostumeSlot(value.slot) ? (
            <Button type="button" variant="secondary" size="sm" className="min-h-8 gap-2 border border-border px-2 text-xs font-semibold" disabled={isAssetSource} onClick={() => openVariantPicker("boots")}>
              <Footprints className="h-4 w-4" aria-hidden="true" />
              {bootsLabel(value)}
            </Button>
          ) : null}
        </div>
      ) : null}
      {onRemove ? (
        <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
          <DialogContent variant="destructive">
            <DialogHeader>
              <DialogTitle>Remove Set Item</DialogTitle>
              <DialogDescription>Remove {cardTitle} from this skin set.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRemoveOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={onRemove}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      <TextureUrlDialog open={textureOpen} onOpenChange={setTextureOpen} value={value.textureUrl} label={skinTypeLabel(value.slot)} placeholder={texturePlaceholder} onSave={(textureUrl) => onChange({ ...value, source: "url", textureUrl, skinAssetId: null, linkedAsset: null })} />
      {allowAssetSource ? <AssetPickerDialog open={assetOpen} onOpenChange={setAssetOpen} slot={value.slot} selectedId={value.skinAssetId} onSelect={selectAsset} /> : null}
      <SlotPickerDialog slot={value.slot} catalog={catalog} open={slotOpen} onOpenChange={setSlotOpen} onSelect={selectSlot} />
      {!isAssetSource && needsCompatibility ? <VariantPickerDialog slot={value.slot} options={compatibilityOptions} selected={value.variants} boots={value.boots ?? true} initialPhase={variantInitialPhase} open={variantOpen} onBootsChange={(boots) => onChange({ ...value, boots })} onOpenChange={setVariantOpen} onToggle={toggleVariant} /> : null}
    </SideCard>
  );
}

function TexturePreviewPanel({ url, label }: { url: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const cleanUrl = url.trim();

  useEffect(() => {
    setFailed(false);
  }, [cleanUrl]);

  if (!cleanUrl || failed) {
    return (
      <div className="flex min-h-40 w-full items-center justify-center gap-3 border border-border bg-muted/40 p-4 text-center text-muted-foreground">
        <ImageIcon className="h-6 w-6 shrink-0" />
        <span className="font-primary text-base font-semibold uppercase leading-none">No texture preview</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-40 overflow-hidden border border-border bg-muted/40">
      <img className="absolute inset-0 h-full w-full object-cover" src={cleanUrl} alt={label} loading="lazy" onError={() => setFailed(true)} />
      <div className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs font-semibold uppercase text-foreground">{label}</div>
    </div>
  );
}

function SelectAssetButton({ slot, onClick }: { slot: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" className="group flex !h-full min-h-40 w-full flex-col items-center justify-center gap-2 border border-border bg-muted/40 p-4 text-center text-foreground hover:bg-foreground hover:text-background" onClick={onClick}>
      <LinkIcon className="h-6 w-6 text-current" aria-hidden="true" />
      <span className="font-primary text-lg font-semibold uppercase text-current">Select {skinTypeLabel(slot)} Asset</span>
      <span className="text-xs text-current opacity-75">Choose one of your skin parts</span>
    </Button>
  );
}

function AssetPickerDialog({ open, onOpenChange, slot, selectedId, onSelect }: { open: boolean; onOpenChange: (open: boolean) => void; slot: string; selectedId?: string | null; onSelect: (asset: WorkshopAsset) => void }) {
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();
  const token = getAccessToken();
  const assetsQuery = useQuery({
    queryKey: ["workshop", "asset-picker", slot, query],
    queryFn: () => listAssets({ mine: true, type: "skin_part", category: "human", slot, q: query, pageSize: 24 }, token),
    enabled: open,
  });

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Select {skinTypeLabel(slot)} Asset</DialogTitle>
          <DialogDescription>Choose one of your published skin parts for this set item.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9 text-sm" placeholder="Search your assets" value={query} onChange={(event) => setQuery(event.target.value)} />
            <span className="sr-only">Search assets</span>
          </label>
          {assetsQuery.isLoading ? (
            <div className="grid min-h-48 place-items-center border border-border bg-card/40">
              <Spinner size="sm" variant="primary" label="Loading assets" />
            </div>
          ) : assetsQuery.isError ? (
            <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">Could not load your assets.</div>
          ) : assetsQuery.data?.assets.length ? (
            <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
              {assetsQuery.data.assets.map((asset, index) => {
                const selected = asset.id === selectedId;
                return (
                  <motion.div key={asset.id} className={`relative z-0 hover:z-50 focus-within:z-50 ${selected ? "ring-2 ring-primary" : ""}`} initial={cardMotionInitial(reduceMotion, 10)} animate={cardMotionAnimate} transition={cardMotionTransition(Math.min(index, 12) * 0.025)}>
                    <WorkshopAssetCard asset={asset} onOpen={() => onSelect(asset)} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">No matching skin parts yet.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextureUrlDialog({
  open,
  onOpenChange,
  value,
  label,
  placeholder,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  label: string;
  placeholder: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  function save() {
    onSave(draft.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} Texture URL</DialogTitle>
          <DialogDescription>Paste the direct image URL for this texture.</DialogDescription>
        </DialogHeader>
        <Field label="Texture URL">
          <Input className="h-10 text-sm" placeholder={placeholder} value={draft} onChange={(event) => setDraft(event.target.value)} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotPickerDialog({
  slot,
  catalog,
  open,
  onOpenChange,
  onSelect,
}: {
  slot: string;
  catalog: VariantCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (slot: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose Skin Item</DialogTitle>
          <DialogDescription>Select the texture slot first. Model selection opens next when this slot needs it.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] auto-rows-fr gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.humanSkinParts.filter((item) => !pairedTilingSlots.has(item)).map((item) => {
            const active = item === slot;
            return (
              <TypeChoice
                key={item}
                active={active}
                compact
                icon={skinTypeIcon(item)}
                title={skinTypeLabel(item)}
                onClick={() => onSelect(item)}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VariantPickerDialog({
  slot,
  options,
  selected,
  boots,
  initialPhase,
  open,
  onBootsChange,
  onOpenChange,
  onToggle,
}: {
  slot: string;
  options: WorkshopVariantOption[];
  selected: string[];
  boots: boolean;
  initialPhase: "models" | "boots";
  open: boolean;
  onBootsChange: (boots: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onToggle: (variant: string) => void;
}) {
  const [phase, setPhase] = useState<"models" | "boots">("models");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const hasGenderGroups = options.some((option) => variantGroup(option.id));
  const hasBootsStep = isCostumeSlot(slot);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) => {
    const label = variantDisplayLabel(option);
    const matchesQuery = !normalizedQuery || option.id.toLowerCase().includes(normalizedQuery) || label.toLowerCase().includes(normalizedQuery) || variantNumber(option.id) === normalizedQuery;
    const matchesGroup = group === "All" || variantGroup(option.id) === group;
    return matchesQuery && matchesGroup;
  });

  useEffect(() => {
    if (open) {
      setPhase(initialPhase);
      setQuery("");
      setGroup("All");
    }
  }, [initialPhase, open, slot]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={phase === "boots" ? "max-w-md" : "max-w-5xl"}>
        <DialogHeader>
          <DialogTitle>{phase === "boots" ? "Costume Boots" : `${skinTypeLabel(slot)} Compatible Models`}</DialogTitle>
          <DialogDescription>{phase === "boots" ? "Set the costume boots option." : "Choose every model this texture fits."}</DialogDescription>
        </DialogHeader>
        {phase === "boots" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TypeChoice active={boots} icon={<Footprints className="h-5 w-5" aria-hidden="true" />} title="Boots On" onClick={() => onBootsChange(true)} />
            <TypeChoice active={!boots} icon={<Footprints className="h-5 w-5" aria-hidden="true" />} title="Boots Off" onClick={() => onBootsChange(false)} />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-52 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-10 pl-9 text-sm" placeholder="Search HairM5, Male 5, 5" value={query} onChange={(event) => setQuery(event.target.value)} />
                <span className="sr-only">Search variants</span>
              </label>
              {hasGenderGroups
                ? ["All", "Male", "Female"].map((item) => (
                    <Button key={item} type="button" variant={group === item ? undefined : "secondary"} onClick={() => setGroup(item)}>
                      {item}
                    </Button>
                  ))
                : null}
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {filteredOptions.map((option) => {
                  const label = variantDisplayLabel(option);
                  const imageUrl = previewUrl(option.previewUrl);
                  const checked = selected.includes(option.id);
                  return (
                    <Button
                      key={option.id}
                      type="button"
                      variant={checked ? "default" : "ghost"}
                      className={`group grid h-auto min-h-44 gap-2 border p-2 text-center ${checked ? "aottg2-emboss-bg aottg2-cta-primary shadow-[0_3px_0_hsl(var(--primary)/0.45)]" : "bg-[color-mix(in_srgb,hsl(var(--input))_58%,hsl(var(--background)))] shadow-[inset_0_1px_5px_rgb(0_0_0_/_0.28),inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-foreground"}`}
                      onClick={() => onToggle(option.id)}
                    >
                      <span className="grid aspect-square h-28 w-full place-items-center overflow-hidden bg-muted/50">
                        {imageUrl ? <img className="max-h-full max-w-full object-contain" src={imageUrl} alt={label} loading="lazy" /> : null}
                      </span>
                      <span className={`font-primary text-lg font-semibold uppercase leading-none ${checked ? "text-primary-foreground" : "text-foreground group-hover:text-background"}`}>{label}</span>
                    </Button>
                  );
                })}
              </div>
              {filteredOptions.length === 0 ? <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">No models match.</div> : null}
            </div>
          </div>
        )}
        <DialogFooter>
          {phase === "boots" ? (
            <Button type="button" variant="ghost" onClick={() => setPhase("models")}>
              Back
            </Button>
          ) : null}
          {phase === "boots" || !hasBootsStep ? (
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : null}
          {phase === "models" && hasBootsStep ? (
            <Button type="button" onClick={() => setPhase("boots")}>
              Next
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
