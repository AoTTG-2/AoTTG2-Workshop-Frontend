import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Spinner, Textarea } from "@aottg2/ui";
import type { RestrictionKindDraft } from "../types";

export function ListTitle({ title, badge, dot = false }: { title: string; badge: string; dot?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="flex min-w-0 items-start gap-2">
        {dot ? <NotificationDot className="mt-1.5 shrink-0" /> : null}
        <span className="min-w-0 break-words font-primary text-sm uppercase leading-snug line-clamp-2">{title}</span>
      </span>
      <Badge className="shrink-0" variant={badge === "open" ? "secondary" : "outline"}>{badge}</Badge>
    </div>
  );
}

export function NotificationDot({ className = "" }: { className?: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full bg-red-500 ${className}`} aria-hidden="true" />;
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border pb-2 last:border-b-0">
      <span className="font-primary text-xs uppercase text-muted-foreground">{label}</span>
      <span className="break-words text-foreground">{value}</span>
    </div>
  );
}

export function LoadingPanel() {
  return <div className="grid min-h-64 place-items-center border border-border bg-card/40"><Spinner variant="primary" label="Loading moderation" /></div>;
}

export function EmptyPanel({ title, text }: { title: string; text: string }) {
  return <div className="border border-border bg-card/40 p-6"><h1 className="font-primary text-2xl uppercase">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>;
}

export function listItemClass(active: boolean) {
  return `grid !h-auto !min-h-24 content-start gap-2 overflow-hidden border p-3 text-left transition-colors hover:border-primary hover:bg-card ${active ? "border-primary bg-card" : "border-border bg-card/40"}`;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="destructive">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AccountRestrictionDialog({
  kind,
  reason,
  expiresAt,
  busy,
  onKind,
  onReason,
  onExpiresAt,
  onOpenChange,
  onConfirm,
}: {
  kind: RestrictionKindDraft | null;
  reason: string;
  expiresAt: string;
  busy: boolean;
  onKind: (kind: RestrictionKindDraft | null) => void;
  onReason: (value: string) => void;
  onExpiresAt: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent variant={kind === "ban" ? "destructive" : undefined}>
        <DialogHeader>
          <DialogTitle>{kind === "ban" ? "Ban Account" : "Suspend Account"}</DialogTitle>
          <DialogDescription>This restriction is enforced by the auth service.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={kind === "suspension" ? "default" : "secondary"} onClick={() => onKind("suspension")}>Suspend</Button>
            <Button type="button" variant={kind === "ban" ? "destructive" : "secondary"} onClick={() => onKind("ban")}>Ban</Button>
          </div>
          {kind === "suspension" ? (
            <div className="grid gap-2">
              <Label htmlFor="account-restriction-expires-at">Suspension ends</Label>
              <Input id="account-restriction-expires-at" type="datetime-local" value={expiresAt} onChange={(event) => onExpiresAt(event.target.value)} />
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="account-restriction-reason">Reason</Label>
            <Textarea id="account-restriction-reason" rows={4} value={reason} onChange={(event) => onReason(event.target.value)} placeholder="Reason shown to the user on login." />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant={kind === "ban" ? "destructive" : "default"} disabled={busy || !reason.trim()} onClick={onConfirm}>{kind === "ban" ? "BAN" : "SUSPEND"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
