import type { AddonForm, CustomLogicForm, MapForm } from "../types";
import { WorkshopFileUploadControl } from "./WorkshopFileUploadControl";

const experienceUploadConfig = {
  map: {
    accept: ".txt,text/plain",
    allowedExtensions: [".txt"],
    heading: "Map File",
    label: "Map File",
  },
  custom_logic: {
    accept: ".cl,.txt,text/plain",
    allowedExtensions: [".cl", ".txt"],
    heading: "Custom Logic File",
    label: "Custom Logic File",
  },
  addon: {
    accept: ".addon,.cl,.txt,text/plain",
    allowedExtensions: [".addon", ".cl", ".txt"],
    heading: "Addon File",
    label: "Addon File",
  },
} as const;

export function MapDataFields({ map, onUploadBusyChange, setMap }: { map: MapForm; onUploadBusyChange: (busy: boolean) => void; setMap: (map: MapForm) => void }) {
  return <ExperienceFileField assetType="map" reference={map.file} onBusyChange={onUploadBusyChange} onReferenceChange={(file) => setMap({ file })} />;
}

export function CustomLogicDataFields({ customLogic, onUploadBusyChange, setCustomLogic }: { customLogic: CustomLogicForm; onUploadBusyChange: (busy: boolean) => void; setCustomLogic: (customLogic: CustomLogicForm) => void }) {
  return <ExperienceFileField assetType="custom_logic" reference={customLogic.file} onBusyChange={onUploadBusyChange} onReferenceChange={(file) => setCustomLogic({ file })} />;
}

export function AddonDataFields({ addon, onUploadBusyChange, setAddon }: { addon: AddonForm; onUploadBusyChange: (busy: boolean) => void; setAddon: (addon: AddonForm) => void }) {
  return <ExperienceFileField assetType="addon" reference={addon.file} onBusyChange={onUploadBusyChange} onReferenceChange={(file) => setAddon({ file })} />;
}

function ExperienceFileField({
  assetType,
  onBusyChange,
  onReferenceChange,
  reference,
}: {
  assetType: keyof typeof experienceUploadConfig;
  onBusyChange: (busy: boolean) => void;
  onReferenceChange: (file: MapForm["file"]) => void;
  reference: MapForm["file"];
}) {
  const config = experienceUploadConfig[assetType];
  return (
    <section className="grid gap-5 border-t border-border pt-6">
      <h2 className="text-sm font-semibold uppercase text-muted-foreground">{config.heading}</h2>
      <WorkshopFileUploadControl
        accept={config.accept}
        allowedExtensions={config.allowedExtensions}
        assetType={assetType}
        label={config.label}
        onBusyChange={onBusyChange}
        onReferenceChange={onReferenceChange}
        reference={reference}
        required={!reference}
      />
    </section>
  );
}
