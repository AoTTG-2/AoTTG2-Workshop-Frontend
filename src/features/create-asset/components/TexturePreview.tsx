import { useEffect, useState } from "react";
import { Button } from "@aottg2/ui";
import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { skinTypeLabel } from "../catalog";

export function TexturePreviewButton({ url, label, emptyLabel, onClick, className = "min-h-40" }: { url: string; label: string; emptyLabel?: string; onClick: () => void; className?: string }) {
  const [failed, setFailed] = useState(false);
  const cleanUrl = url.trim();
  const emptyText = (emptyLabel ?? `Set ${label}`).trim();

  useEffect(() => {
    setFailed(false);
  }, [cleanUrl]);

  if (!cleanUrl || failed) {
    return (
      <Button type="button" variant="ghost" className={`flex ${className} w-full flex-wrap items-center justify-center gap-2 overflow-hidden border border-border bg-muted/40 p-3 text-center text-foreground`} onClick={onClick}>
        <ImageIcon className="h-6 w-6 shrink-0 text-current" />
        <span className="max-w-full whitespace-normal break-words font-primary text-xs font-semibold uppercase leading-none text-current">
          {emptyText}
        </span>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" className={`relative ${className} w-full overflow-hidden border border-border bg-muted/40 p-0`} onClick={onClick}>
      <img className="absolute inset-0 h-full w-full object-cover" src={cleanUrl} alt={label} loading="lazy" onError={() => setFailed(true)} />
      <span className="sr-only">Change texture URL</span>
    </Button>
  );
}
export function TexturePreviewPanel({ url, label, className = "min-h-40" }: { url: string; label: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const cleanUrl = url.trim();

  useEffect(() => {
    setFailed(false);
  }, [cleanUrl]);

  if (!cleanUrl || failed) {
    return (
      <div className={`flex ${className} w-full items-center justify-center gap-3 border border-border bg-muted/40 p-4 text-center text-muted-foreground`}>
        <ImageIcon className="h-6 w-6 shrink-0" />
        <span className="font-primary text-base font-semibold uppercase leading-none">No texture preview</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden border border-border bg-muted/40`}>
      <img className="absolute inset-0 h-full w-full object-cover" src={cleanUrl} alt={label} loading="lazy" onError={() => setFailed(true)} />
      <div className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs font-semibold uppercase text-foreground">{label}</div>
    </div>
  );
}

export function SelectAssetButton({ slot, onClick, className = "min-h-40" }: { slot: string; onClick: () => void; className?: string }) {
  return (
    <Button type="button" variant="ghost" className={`group flex ${className} w-full flex-col items-center justify-center gap-2 border border-border bg-muted/40 p-4 text-center text-foreground hover:bg-foreground hover:text-background`} onClick={onClick}>
      <LinkIcon className="h-6 w-6 text-current" aria-hidden="true" />
      <span className="font-primary text-lg font-semibold uppercase text-current">Select {skinTypeLabel(slot)} Asset</span>
      <span className="text-xs text-current opacity-75">Choose one of your skin parts</span>
    </Button>
  );
}
