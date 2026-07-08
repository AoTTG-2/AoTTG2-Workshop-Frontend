import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@aottg2/ui";
import Link from "next/link";
import { Field } from "./Field";

export function CreatorNameDialog({ busy, canSave, creatorNameAccepted, creatorNameInput, onAcceptedChange, onConfirm, onInputChange, onOpenChange, open }: { busy: boolean; canSave: boolean; creatorNameAccepted: boolean; creatorNameInput: string; onAcceptedChange: (accepted: boolean) => void; onConfirm: () => void; onInputChange: (value: string) => void; onOpenChange: (open: boolean) => void; open: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="destructive">
        <DialogHeader>
          <DialogTitle>Set Creator Name Forever</DialogTitle>
          <DialogDescription>Choose carefully. Your creator name can only be set once because it becomes part of every asset link.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Creator Name"><Input className="h-10 text-sm" value={creatorNameInput} maxLength={64} onChange={(event) => onInputChange(event.target.value)} /></Field>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Checkbox id="creator-name-forever" checked={creatorNameAccepted} onCheckedChange={(checked) => onAcceptedChange(checked === true)} />
            <Label htmlFor="creator-name-forever" className="leading-5">I understand this creator name is permanent.</Label>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Creator names must follow{" "}
            <Link href="/legal/content-rules" className="font-medium text-primary hover:underline">Content Rules</Link>
            {" "}and{" "}
            <Link href="/legal/community" className="font-medium text-primary hover:underline">Community Guidelines</Link>.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={!canSave} onClick={onConfirm}>{busy ? "Saving..." : "Set Forever And Publish"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
