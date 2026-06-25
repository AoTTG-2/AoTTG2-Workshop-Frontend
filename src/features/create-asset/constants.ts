import type { VariantCatalog } from "@/lib/api/workshop";
import type { WizardStep } from "./types";
import { toCatalogOption } from "./variants";

export const wizardSteps: { key: WizardStep; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "data", label: "Texture" },
  { key: "listing", label: "Listing" },
  { key: "description", label: "Publish" },
];
export const editWizardSteps = wizardSteps.filter((step) => step.key !== "type");
export const previewCreatedAt = new Date().toISOString();
export const previewEngagement = {
  downloadCount: 152,
  likeCount: 41,
  favoriteCount: 18,
  viewCount: 640,
  commentCount: 7,
};
export const cardMotionAnimate = { opacity: 1, y: 0 };

export const skinTypeLabels: Record<string, string> = {
  Set: "Set",
  Eye: "Eyes",
  Glass: "Glasses",
  Skin: "Body Skin",
  Logo: "Cape Logo",
  GearL: "Left Blade",
  GearR: "Right Blade",
  Blades: "Blades",
  AHSS: "AHSS",
  APG: "APG",
  Gas: "Gas Smoke",
  WeaponTrail: "Blade Trail",
  ThunderspearL: "Left Thunderspear",
  ThunderspearR: "Right Thunderspear",
  Thunderspears: "Thunderspears",
  HookL: "Left Hook",
  HookR: "Right Hook",
  Hooks: "Hooks",
  Hat: "Hat",
  Head: "Head Accessory",
  Back: "Back Accessory",
};

export const shifterTargets = [
  { key: "eren", label: "Eren" },
  { key: "annie", label: "Annie" },
  { key: "colossal", label: "Colossal" },
] as const;

export const skyboxFaces = [
  { key: "up", label: "Top" },
  { key: "left", label: "Left" },
  { key: "front", label: "Front" },
  { key: "right", label: "Right" },
  { key: "back", label: "Back" },
  { key: "down", label: "Bottom" },
] as const;

export const groupedSlots = new Set(["Blades", "AHSS", "APG", "Thunderspears", "Hooks"]);
export const legacyGroupedSlots = new Set(["GearL", "GearR", "ThunderspearL", "ThunderspearR", "HookL", "HookR", "HookLTiling", "HookRTiling"]);

export const fallbackCatalog: VariantCatalog = {
  hairMale: Array.from({ length: 35 }, (_, i) => `HairM${i}`),
  hairFemale: Array.from({ length: 33 }, (_, i) => `HairF${i}`),
  costumeMale: Array.from({ length: 12 }, (_, i) => `CostumeM${i}`),
  costumeFemale: Array.from({ length: 11 }, (_, i) => `CostumeF${i}`),
  hat: ["HatNone", ...Array.from({ length: 17 }, (_, i) => `Hat${i}`)],
  head: ["HeadNone", ...Array.from({ length: 8 }, (_, i) => `Head${i}`)],
  back: ["BackNone", ...Array.from({ length: 8 }, (_, i) => `Back${i}`)],
  humanSkinParts: ["Hair", "Eye", "Glass", "Face", "Skin", "Costume", "Logo", "Blades", "AHSS", "APG", "GearL", "GearR", "Gas", "Hoodie", "WeaponTrail", "Horse", "Thunderspears", "ThunderspearL", "ThunderspearR", "Hooks", "HookL", "HookLTiling", "HookR", "HookRTiling", "Hat", "Head", "Back"],
  humanCompatibilitySlots: ["Hair", "Costume", "Hat", "Head", "Back"],
  humanCompatibilityVariants: {
    Hair: [...Array.from({ length: 35 }, (_, i) => `HairM${i}`), ...Array.from({ length: 33 }, (_, i) => `HairF${i}`)].map(toCatalogOption),
    Costume: [...Array.from({ length: 12 }, (_, i) => `CostumeM${i}`), ...Array.from({ length: 11 }, (_, i) => `CostumeF${i}`)].map(toCatalogOption),
    Hat: Array.from({ length: 17 }, (_, i) => `Hat${i}`).map(toCatalogOption),
    Head: Array.from({ length: 8 }, (_, i) => `Head${i}`).map(toCatalogOption),
    Back: Array.from({ length: 8 }, (_, i) => `Back${i}`).map(toCatalogOption),
  },
  textureUrlAllowlist: ["i.imgur.com/", "imgur.com/", "image.ibb.co/", "i.ibb.co/", "i.reddit.it/", "cdn.discordapp.com/attachments/", "media.discordapp.net/attachments/", "images-ext-2.discordapp.net/external/", "gyazo.com/", "puu.sh/", "i.postimg.cc/", "postimg./", "deviantart.com/", "photobucket.com/", "aotcorehome.files.wordpress.com/", "s1.ax1x.com/", "s27.postimg.io/", "1.bp.blogspot.com/", "tiebapic.baidu.com/", "s25.postimg.gg/", "imgse.com/"],
  textureFileExtensions: [".jpg", ".png", ".jpeg"],
};
