"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from "@aottg2/ui";
import { useState } from "react";

const reasons = [
  ["spam", "Spam"],
  ["harassment", "Harassment"],
  ["stolen", "Stolen content"],
  ["broken", "Broken/misleading"],
  ["inappropriate", "Inappropriate"],
  ["other", "Other"],
] as const;

export function ReportDialog({ open, title, description, busy, onOpenChange, onSubmit }: { open: boolean; title: string; description: string; busy?: boolean; onOpenChange: (open: boolean) => void; onSubmit: (reason: string, details: string | null) => void | Promise<void> }) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");

  async function submit() {
    await onSubmit(reason, details.trim() || null);
    setDetails("");
    setReason("spam");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2">
            <Label>Reason</Label>
            <select className="min-h-10 border border-border bg-background px-3 font-primary text-sm uppercase text-foreground" value={reason} onChange={(event) => setReason(event.target.value)}>
              {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <Label>Details</Label>
            <Textarea value={details} maxLength={1000} rows={4} onChange={(event) => setDetails(event.target.value)} />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void submit()}>Submit Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
