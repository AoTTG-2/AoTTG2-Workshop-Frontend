import { FileArchive, Image as ImageIcon, Code2, Map, Sparkles, UserRound, Zap } from "lucide-react";
import { SideCard } from "@/components/SideCard";
import { legacyGroupedSlots, shifterTargets } from "../constants";
import { skinTypeIcon, skinTypeLabel, targetSlotPatch } from "../catalog";
import type { AssetKind, ShifterSkinSetForm, SkinCategory, VariantTargetForm } from "../types";
import { TypeChoice } from "./TypeChoice";

export function TypeStep({ humanPartChoices, kind, part, setKind, setPart, setShifter, shifter, skinCategory, selectSkinCategory }: { humanPartChoices: string[]; kind: AssetKind; part: VariantTargetForm; setKind: (kind: AssetKind | ((kind: AssetKind) => AssetKind)) => void; setPart: (update: VariantTargetForm | ((part: VariantTargetForm) => VariantTargetForm)) => void; setShifter: (update: ShifterSkinSetForm | ((shifter: ShifterSkinSetForm) => ShifterSkinSetForm)) => void; shifter: ShifterSkinSetForm; skinCategory: SkinCategory; selectSkinCategory: (category: SkinCategory) => void }) {
  const skinActive = kind === "skin_part" || kind === "skin_set" || kind === "shifter_skin_set" || kind === "skybox_skin_set";

  return (
    <section className="grid gap-6 border-t border-border pt-6">
      <SideCard title="Category" variant="secondary" contentClassName="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TypeChoice active={skinActive} icon={<Sparkles className="h-5 w-5" aria-hidden="true" />} title="Skins" body="Human, Shifter, and Skybox texture assets." onClick={() => selectSkinCategory(skinCategory)} />
        <TypeChoice active={kind === "map"} icon={<Map className="h-5 w-5" aria-hidden="true" />} title="Maps" body="Playable level data and map metadata." onClick={() => setKind("map")} />
        <TypeChoice active={kind === "custom_logic"} icon={<Code2 className="h-5 w-5" aria-hidden="true" />} title="Custom Logic" body="Script files and runtime metadata." onClick={() => setKind("custom_logic")} />
        <TypeChoice active={kind === "addon"} icon={<FileArchive className="h-5 w-5" aria-hidden="true" />} title="Addons" body="Small addon file bundles using the backend contract." onClick={() => setKind("addon")} />
      </SideCard>
      {skinActive ? (
        <SideCard title="Skin Category" variant="secondary" contentClassName="grid auto-rows-fr gap-4 sm:grid-cols-3">
          <TypeChoice active={skinCategory === "human"} icon={<UserRound className="h-5 w-5" aria-hidden="true" />} title="Human" body="Skin parts and human skin sets." onClick={() => selectSkinCategory("human")} />
          <TypeChoice active={skinCategory === "shifter"} icon={<Zap className="h-5 w-5" aria-hidden="true" />} title="Shifter" body="Eren, Annie, and Colossal textures." onClick={() => selectSkinCategory("shifter")} />
          <TypeChoice active={skinCategory === "skybox"} icon={<ImageIcon className="h-5 w-5" aria-hidden="true" />} title="Skybox" body="Six face texture set with preview." onClick={() => selectSkinCategory("skybox")} />
        </SideCard>
      ) : null}
      {skinActive && skinCategory === "human" ? (
        <SideCard title="Skin Type" variant="secondary" contentClassName="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <TypeChoice active={kind === "skin_set"} icon={skinTypeIcon("Set")} title={skinTypeLabel("Set")} body="Publish multiple skin parts together. Add Hair, Eyes, Costume, Hooks, and other texture URLs in one asset." onClick={() => setKind("skin_set")} />
          </div>
          {humanPartChoices.filter((slot) => !legacyGroupedSlots.has(slot)).map((slot) => (
            <TypeChoice key={slot} active={kind === "skin_part" && part.slot === slot} compact icon={skinTypeIcon(slot)} title={skinTypeLabel(slot)} onClick={() => { setKind("skin_part"); setPart((current) => targetSlotPatch(current, slot)); }} />
          ))}
        </SideCard>
      ) : skinActive && skinCategory === "shifter" ? (
        <SideCard title="Shifter Type" variant="secondary" contentClassName="grid auto-rows-fr gap-3 sm:grid-cols-3">
          {shifterTargets.map((target) => (
            <TypeChoice key={target.key} active={shifter.target === target.key} compact icon={<Zap className="h-5 w-5" aria-hidden="true" />} title={target.label} onClick={() => setShifter((current) => ({ ...current, target: target.key }))} />
          ))}
        </SideCard>
      ) : null}
    </section>
  );
}
