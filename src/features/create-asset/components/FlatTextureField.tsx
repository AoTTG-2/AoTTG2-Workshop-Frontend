import { useState } from "react";
import { SideCard } from "@/components/SideCard";
import { TexturePreviewButton } from "./TexturePreview";
import { TextureUrlDialog } from "./TextureUrlDialog";

export function FlatTextureField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <SideCard title={label} contentClassName="grid">
      <TexturePreviewButton url={value} label={`${label} texture`} emptyLabel={`Set ${label} texture`} onClick={() => setOpen(true)} className="!h-56 !min-h-56" />
      <TextureUrlDialog open={open} onOpenChange={setOpen} value={value} label={label} placeholder={placeholder} onSave={onChange} />
    </SideCard>
  );
}
