"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Spinner } from "@aottg2/ui";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/auth/storage";
import { useAuth } from "@/auth/useAuth";
import { canModerateAssets } from "@/auth/workshopPermissions";
import { SideCard } from "@/components/SideCard";
import { assetPath, createAsset, getVariantCatalog, setCreatorName, updateAsset, type ShifterSkinSetPayload, type SkinSetPayload, type SkyboxSkinSetPayload, type WorkshopAsset } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import { targetSlotPatch, blankSetItem, isCompatibilitySlot, skinPartSlot } from "./catalog";
import { editWizardSteps, fallbackCatalog, legacyGroupedSlots, wizardSteps } from "./constants";
import { selectError } from "./error";
import { normalizeSlug } from "./form-utils";
import { blankEditablePart, categoryFromAsset, commonFromAsset, displayTargetFromAsset, isEditableAsset, shifterFromAsset, skyboxFromAsset, targetsFromSkinSet } from "./hydrateAsset";
import { buildAsset, prepareSetItem, prepareShifterSkinSet, prepareSkyboxSkinSet, prepareTarget, updatePayloadFromAssetForm } from "./payload";
import type { AssetKind, CreateAssetProps, ShifterSkinSetForm, SkinCategory, SkyboxSkinSetForm, VariantTargetForm, WizardStep } from "./types";
import { commonSchema, validateListingMedia } from "./validation";
import { CreatorNameDialog } from "./components/CreatorNameDialog";
import { DataStep } from "./components/DataStep";
import { DescriptionStep } from "./components/DescriptionStep";
import { ListingStep } from "./components/ListingStep";
import { PublishAttestations, allRequiredPublishAttestationsAccepted, createPublishAttestationState, type PublishAttestationKey } from "./components/PublishAttestations";
import { StepNav } from "./components/StepNav";
import { TypeStep } from "./components/TypeStep";

export function CreateAsset({ mode = "create", initialAsset = null }: CreateAssetProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, profile, refreshProfile, workshopUser } = useAuth();
  const { data: loadedCatalog } = useQuery({ queryKey: ["workshop", "variants"], queryFn: getVariantCatalog, staleTime: 60 * 60 * 1000 });
  const catalog = loadedCatalog ?? fallbackCatalog;
  const isEdit = mode === "edit";
  const steps = isEdit ? editWizardSteps : wizardSteps;
  const editableAsset = isEditableAsset(initialAsset) ? initialAsset : null;
  const authorName = profile?.displayName ?? "You";
  const [skinCategory, setSkinCategory] = useState<SkinCategory>(() => categoryFromAsset(editableAsset));
  const [kind, setKind] = useState<AssetKind>(() => editableAsset?.type ?? "skin_part");
  const [step, setStep] = useState<WizardStep>(() => (isEdit ? "listing" : "type"));
  const [common, setCommon] = useState(() => commonFromAsset(editableAsset));
  const [part, setPart] = useState<VariantTargetForm>(() => blankEditablePart(editableAsset));
  const [items, setItems] = useState<VariantTargetForm[]>(() => (editableAsset?.type === "skin_set" ? targetsFromSkinSet(editableAsset.payload as SkinSetPayload) : []));
  const [shifter, setShifter] = useState<ShifterSkinSetForm>(() => (editableAsset?.type === "shifter_skin_set" ? shifterFromAsset(editableAsset.payload as ShifterSkinSetPayload) : { target: "eren", textureUrl: "" }));
  const [skybox, setSkybox] = useState<SkyboxSkinSetForm>(() => (editableAsset?.type === "skybox_skin_set" ? skyboxFromAsset(editableAsset.payload as SkyboxSkinSetPayload) : { front: "", back: "", left: "", right: "", up: "", down: "" }));
  const [newSetItem, setNewSetItem] = useState<VariantTargetForm | null>(null);
  const [newSetItemSourceOpen, setNewSetItemSourceOpen] = useState(false);
  const [newSetItemSlotOpen, setNewSetItemSlotOpen] = useState(false);
  const [newSetItemAssetOpen, setNewSetItemAssetOpen] = useState(false);
  const [newSetItemVariantOpen, setNewSetItemVariantOpen] = useState(false);
  const [newSetItemVariantInitialPhase, setNewSetItemVariantInitialPhase] = useState<"models" | "boots">("models");
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  const [creatorNameInput, setCreatorNameInput] = useState("");
  const [creatorNameAccepted, setCreatorNameAccepted] = useState(false);
  const [creatorNameBusy, setCreatorNameBusy] = useState(false);
  const [pendingAsset, setPendingAsset] = useState<unknown>(null);
  const [publishAttestations, setPublishAttestations] = useState(createPublishAttestationState);
  const [officialUseContactAllowed, setOfficialUseContactAllowed] = useState(() => editableAsset?.officialUseContactAllowed === true);
  const stepIndex = Math.max(steps.findIndex((item) => item.key === step), 0);
  const normalizedCreatorName = normalizeSlug(creatorNameInput);
  const canSetCreatorName = Boolean(normalizedCreatorName) && normalizedCreatorName.length <= 32 && creatorNameAccepted && !creatorNameBusy;
  const canSubmitPublish = stepIndex < steps.length - 1 || allRequiredPublishAttestationsAccepted(publishAttestations);
  const humanPartChoices = catalog.humanSkinParts.filter((slot) => slot && !legacyGroupedSlots.has(slot));
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
    onError: (nextError) => toast.error(isEdit ? "Could not update asset" : "Could not create asset", { description: selectError(nextError), id: "create-asset-error" }),
  });

  function updateItem(index: number, patch: Partial<VariantTargetForm>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function selectSkinCategory(category: SkinCategory) {
    setSkinCategory(category);
    if (category === "human") {
      setKind((current) => (current === "skin_part" || current === "skin_set" ? current : "skin_set"));
      return;
    }
    setKind(category === "shifter" ? "shifter_skin_set" : "skybox_skin_set");
  }

  function startAddSetItem() {
    setNewSetItem(null);
    setNewSetItemAssetOpen(false);
    setNewSetItemSlotOpen(false);
    setNewSetItemVariantOpen(false);
    setNewSetItemSourceOpen(true);
  }

  function selectNewSetItemSlot(slot: string) {
    const item = blankSetItem(slot);
    setNewSetItem(item);
    setNewSetItemSlotOpen(false);
    if (isCompatibilitySlot(slot, catalog)) {
      setNewSetItemVariantInitialPhase("models");
      setNewSetItemVariantOpen(true);
      return;
    }
    setItems((current) => [...current, item]);
    setNewSetItem(null);
  }

  function addNewSetItemAsset(asset: WorkshopAsset) {
    const slot = skinPartSlot(asset) || "Hair";
    const item = { ...targetSlotPatch({ source: "asset", slot, textureUrl: "", variants: [] }, slot), ...displayTargetFromAsset(asset), source: "asset" as const, skinAssetId: asset.id, linkedAsset: asset };
    setItems((current) => [...current, item]);
    setNewSetItemAssetOpen(false);
  }

  function validateStep() {
    if (step === "listing") {
      commonSchema.parse(common);
      validateListingMedia(common);
    }
    if (step === "data") {
      if (kind === "skin_part") prepareTarget(part, catalog);
      else if (kind === "skin_set") {
        if (items.length === 0) throw new Error("Add at least one set item");
        items.forEach((item) => prepareSetItem(item, catalog));
      } else if (kind === "shifter_skin_set") prepareShifterSkinSet(shifter, catalog);
      else prepareSkyboxSkinSet(skybox, catalog);
    }
    if (step === "description") buildAsset(kind, common, part, items, shifter, skybox, catalog);
  }

  function updatePublishAttestation(id: PublishAttestationKey, checked: boolean) {
    setPublishAttestations((current) => ({ ...current, [id]: checked }));
  }

  function goNext() {
    try {
      validateStep();
      setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].key);
    } catch (nextError) {
      toast.error("Could not continue", { description: selectError(nextError), id: "create-asset-error" });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    if (stepIndex < steps.length - 1) return goNext();
    try {
      if (!allRequiredPublishAttestationsAccepted(publishAttestations)) {
        return toast.error("Publish acknowledgements required", { description: "Check every required responsibility box before publishing.", id: "create-asset-error" });
      }
      const asset = { ...buildAsset(kind, common, part, items, shifter, skybox, catalog), officialUseContactAllowed };
      if (isEdit) return mutation.mutate(updatePayloadFromAssetForm(asset));
      if (!workshopUser) return toast.error("Could not load Workshop profile", { description: "Try again in a moment." });
      if (!workshopUser.creatorName) {
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
    if (!token) return toast.error("Could not set creator name", { description: "Sign in again before publishing." });
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

  if (isEdit && !editableAsset) return <UnavailableState title="Editing Unavailable" text="This asset type cannot be edited in the Workshop form yet." button="Back to library" onClick={() => router.push("/library")} />;
  if (isLoading) return <main className="grid min-h-[calc(100vh-120px)] place-items-center"><Spinner size="lg" variant="primary" label="Checking access" /></main>;
  if (isEdit && !canEditAsset) return <UnavailableState title="No Edit Access" text="Only the creator or a Workshop moderator can edit this asset." button="Back to asset" onClick={() => router.push(cancelPath)} />;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">{isEdit ? "Edit Asset" : "Publish Asset"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{isEdit ? "Update the current listing, media URLs, and texture data." : "Create a URL-backed skin part or embedded-texture skin set."}</p>
      </header>
      <form className="grid gap-8" onSubmit={handleSubmit}>
        <StepNav steps={steps} step={step} stepIndex={stepIndex} isEdit={isEdit} onStep={setStep} />
        {step === "type" ? <TypeStep humanPartChoices={humanPartChoices} kind={kind} part={part} setKind={setKind} setPart={setPart} setShifter={setShifter} shifter={shifter} skinCategory={skinCategory} selectSkinCategory={selectSkinCategory} /> : null}
        {step === "listing" ? <ListingStep authorName={authorName} common={common} isEdit={isEdit} kind={kind} setCommon={setCommon} skinCategory={skinCategory} /> : null}
        {step === "data" ? <DataStep addNewSetItem={() => { if (newSetItem) { setItems((current) => [...current, newSetItem]); setNewSetItem(null); setNewSetItemVariantOpen(false); } }} addNewSetItemAsset={addNewSetItemAsset} catalog={catalog} items={items} kind={kind} newSetItem={newSetItem} newSetItemAssetOpen={newSetItemAssetOpen} newSetItemSlotOpen={newSetItemSlotOpen} newSetItemSourceOpen={newSetItemSourceOpen} newSetItemVariantInitialPhase={newSetItemVariantInitialPhase} newSetItemVariantOpen={newSetItemVariantOpen} part={part} selectNewSetItemSlot={selectNewSetItemSlot} setItems={setItems} setNewSetItem={setNewSetItem} setNewSetItemAssetOpen={setNewSetItemAssetOpen} setNewSetItemSlotOpen={setNewSetItemSlotOpen} setNewSetItemSourceOpen={setNewSetItemSourceOpen} setNewSetItemVariantOpen={setNewSetItemVariantOpen} setPart={setPart} setShifter={setShifter} setSkybox={setSkybox} shifter={shifter} skybox={skybox} startAddSetItem={startAddSetItem} startAddSetItemAsset={() => { setNewSetItemSourceOpen(false); setNewSetItemAssetOpen(true); }} startAddSetItemUrl={() => { setNewSetItemSourceOpen(false); setNewSetItemSlotOpen(true); }} toggleNewSetItemVariant={(variant) => setNewSetItem((current) => current ? { ...current, variants: current.variants.includes(variant) ? current.variants.filter((item) => item !== variant) : [...current.variants, variant] } : current)} updateItem={updateItem} /> : null}
        {step === "description" ? (
          <>
            <DescriptionStep common={common} items={items} kind={kind} part={part} setCommon={setCommon} shifter={shifter} skybox={skybox} />
            <PublishAttestations officialUseContactAllowed={officialUseContactAllowed} onAttestationChange={updatePublishAttestation} onOfficialUseContactAllowedChange={setOfficialUseContactAllowed} values={publishAttestations} />
          </>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="ghost" onClick={() => router.push(cancelPath)}>Cancel</Button>
          {stepIndex > 0 ? <Button type="button" variant="secondary" onClick={() => setStep(steps[Math.max(stepIndex - 1, 0)].key)}>Back</Button> : null}
          <Button type="submit" disabled={mutation.isPending || !canSubmitPublish}>{stepIndex < steps.length - 1 ? "Next" : mutation.isPending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Publish Asset"}</Button>
        </div>
      </form>
      <CreatorNameDialog busy={creatorNameBusy} canSave={canSetCreatorName} creatorNameAccepted={creatorNameAccepted} creatorNameInput={creatorNameInput} onAcceptedChange={setCreatorNameAccepted} onConfirm={() => void confirmCreatorName()} onInputChange={setCreatorNameInput} onOpenChange={updateCreatorDialogOpen} open={creatorDialogOpen} />
    </main>
  );
}

function UnavailableState({ button, onClick, text, title }: { button: string; onClick: () => void; text: string; title: string }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-3xl place-items-center px-6 py-8">
      <SideCard title={title} variant="secondary">
        <p className="text-sm text-muted-foreground">{text}</p>
        <Button type="button" className="mt-4" onClick={onClick}>{button}</Button>
      </SideCard>
    </main>
  );
}
