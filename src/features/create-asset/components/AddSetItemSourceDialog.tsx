import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@aottg2/ui";
import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { TypeChoice } from "./TypeChoice";

export function AddSetItemSourceDialog({ open, onOpenChange, onUseUrl, onUseAsset }: { open: boolean; onOpenChange: (open: boolean) => void; onUseUrl: () => void; onUseAsset: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Set Item</DialogTitle>
          <DialogDescription>Choose how this skin set item should be added.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <TypeChoice active={false} icon={<ImageIcon className="h-5 w-5" aria-hidden="true" />} title="Use URL" body="Paste a texture URL and choose the matching skin item." onClick={onUseUrl} />
          <TypeChoice active={false} icon={<LinkIcon className="h-5 w-5" aria-hidden="true" />} title="Use Existing Asset" body="Pick one of your published skin parts." onClick={onUseAsset} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
