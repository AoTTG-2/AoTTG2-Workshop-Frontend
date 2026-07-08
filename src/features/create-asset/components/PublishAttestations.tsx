"use client";

import { Checkbox, Label } from "@aottg2/ui";
import Link from "next/link";

export type PublishAttestationKey =
  | "createdOrAuthorized"
  | "hostDisplayModerate"
  | "grantSelectedPermission"
  | "noUnauthorizedMaterial"
  | "rulesAndRemoval";

export type PublishAttestationState = Record<PublishAttestationKey, boolean>;

const requiredAttestations: Array<{ id: PublishAttestationKey; label: string }> = [
  {
    id: "createdOrAuthorized",
    label: "I created this material or have authorization to submit this listing, URL, or uploaded file.",
  },
  {
    id: "hostDisplayModerate",
    label: "I am authorized to let AoTTG2 host, display, link, scan, moderate, and make this material available through the Workshop.",
  },
  {
    id: "grantSelectedPermission",
    label: "I am authorized to grant the usage permission selected above.",
  },
  {
    id: "noUnauthorizedMaterial",
    label: "This listing and any uploaded file do not contain ripped, extracted, leaked, paid, private, malicious, or unauthorized material.",
  },
  {
    id: "rulesAndRemoval",
    label: "I agree to the Workshop rules and understand AoTTG2 may disable the listing, URL, or hosted file after a complaint or policy violation.",
  },
];

export function createPublishAttestationState(): PublishAttestationState {
  return {
    createdOrAuthorized: false,
    hostDisplayModerate: false,
    grantSelectedPermission: false,
    noUnauthorizedMaterial: false,
    rulesAndRemoval: false,
  };
}

export function allRequiredPublishAttestationsAccepted(state: PublishAttestationState) {
  return requiredAttestations.every((item) => state[item.id]);
}

export function PublishAttestations({
  officialUseContactAllowed,
  onAttestationChange,
  onOfficialUseContactAllowedChange,
  values,
}: {
  officialUseContactAllowed: boolean;
  onAttestationChange: (id: PublishAttestationKey, checked: boolean) => void;
  onOfficialUseContactAllowedChange: (checked: boolean) => void;
  values: PublishAttestationState;
}) {
  return (
    <section className="grid gap-4 border border-border/70 bg-card/40 p-4 md:p-5" aria-labelledby="publish-attestations-title">
      <div className="grid gap-2">
        <h2 id="publish-attestations-title" className="font-primary text-xl font-semibold uppercase leading-none tracking-tight">Publish Responsibility</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Required before publishing or saving material changes. See{" "}
          <Link href="/legal/content-rules" className="font-medium text-primary hover:underline" target="_blank" rel="noreferrer">Content Rules</Link>
          {" "}and{" "}
          <Link href="/legal/asset-usage" className="font-medium text-primary hover:underline" target="_blank" rel="noreferrer">Asset Usage Guide</Link>.
        </p>
      </div>

      <div className="grid gap-3">
        {requiredAttestations.map((item) => (
          <div key={item.id} className="flex items-start gap-3 text-sm text-muted-foreground">
            <Checkbox id={`publish-${item.id}`} checked={values[item.id]} onCheckedChange={(checked) => onAttestationChange(item.id, checked === true)} />
            <Label htmlFor={`publish-${item.id}`} className="leading-5">{item.label}</Label>
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 pt-4">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Checkbox id="publish-official-use-contact" checked={officialUseContactAllowed} onCheckedChange={(checked) => onOfficialUseContactAllowedChange(checked === true)} />
          <Label htmlFor="publish-official-use-contact" className="leading-5">
            I am open to the AoTTG2 team contacting me about using this submission, or parts of it, as official AoTTG2 material. I understand this does not guarantee selection, payment, credit, or acceptance, and that any official use may require a separate written permission or agreement.
          </Label>
        </div>
      </div>
    </section>
  );
}
