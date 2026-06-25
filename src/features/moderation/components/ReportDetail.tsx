import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@aottg2/ui";
import { useMutation } from "@tanstack/react-query";
import { Ban, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { getAccessToken } from "@/auth/storage";
import { useAuth } from "@/auth/useAuth";
import { canModerateAssets, canModerateComments, canResolveReports, canRestrictUsers } from "@/auth/workshopPermissions";
import { deleteWorkshopAsset, dismissModerationReport, hideModerationAsset, hideModerationComment, resolveModerationReport, restrictAuthAccount, type WorkshopReport } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import type { ReportAction, RestrictionKindDraft } from "../types";
import { AccountRestrictionDialog, ConfirmDialog, DetailRow, EmptyPanel } from "./Common";
import { actorLabel, confirmDescription, confirmLabel, confirmTitle, defaultExpiryLocal, parseSnapshot, snapshotSummary, snapshotValue, targetTitle } from "../utils";

export function ReportDetail({ report, note, onNote, onDone }: { report: WorkshopReport | null; note: string; onNote: (value: string) => void; onDone: () => void }) {
  const { profile, workshopUser } = useAuth();
  const permissionSource = workshopUser ?? profile;
  const token = getAccessToken();
  const snapshot = parseSnapshot(report?.snapshotJson);
  const [confirmAction, setConfirmAction] = useState<ReportAction | null>(null);
  const [accountRestrictionKind, setAccountRestrictionKind] = useState<RestrictionKindDraft | null>(null);
  const [accountRestrictionReason, setAccountRestrictionReason] = useState("");
  const [accountRestrictionExpiresAt, setAccountRestrictionExpiresAt] = useState(defaultExpiryLocal());
  const run = useMutation({
    mutationFn: async (action: ReportAction | "dismiss") => {
      if (!report || !token) return;
      const assetId = snapshotValue(snapshot, "publicId") || report.targetId;
      const accountRestrictionEnd = accountRestrictionKind === "suspension" ? new Date(accountRestrictionExpiresAt) : null;
      if (action === "hide-asset") {
        await hideModerationAsset(assetId, token);
        await resolveModerationReport(report.id, token, note);
      }
      if (action === "delete-asset") {
        await deleteWorkshopAsset(assetId, token);
        await resolveModerationReport(report.id, token, note);
      }
      if (action === "hide-comment") {
        await hideModerationComment(report.targetId, token);
        await resolveModerationReport(report.id, token, note);
      }
      if (action === "ban-account" || action === "suspend-account") {
        if (!accountRestrictionKind) return;
        if (accountRestrictionKind === "suspension" && (!accountRestrictionEnd || Number.isNaN(accountRestrictionEnd.getTime()) || accountRestrictionEnd <= new Date())) {
          throw new Error("Choose a future suspension end time.");
        }
        await restrictAuthAccount(token, report.targetOwnerAuthAccountId, {
          kind: accountRestrictionKind,
          reason: accountRestrictionReason.trim(),
          expiresAt: accountRestrictionEnd?.toISOString() ?? null,
        });
        await resolveModerationReport(report.id, token, note || accountRestrictionReason);
      }
      if (action === "dismiss") await dismissModerationReport(report.id, token, note);
    },
    onSuccess: (_, action) => {
      toast.success("Moderation updated", { description: action === "dismiss" ? "Report dismissed." : "Report resolved." });
      setConfirmAction(null);
      setAccountRestrictionKind(null);
      setAccountRestrictionReason("");
      onDone();
    },
    onError: (error) => toast.error("Moderation failed", { description: error instanceof Error ? error.message : "Try again." }),
  });

  if (!report) return <EmptyPanel title="Select a report" text="Choose a report from the queue." />;

  return (
    <>
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{targetTitle(report)}</CardTitle>
          <Badge variant={report.status === "open" ? "secondary" : "outline"}>{report.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <DetailRow label="Reason" value={report.reason} />
          <DetailRow label="Details" value={report.details || "None"} />
          <DetailRow label="Reporter" value={actorLabel(report.reporterDisplayName, report.reporterAuthAccountId)} />
          <DetailRow label="Target Owner" value={actorLabel(report.targetOwnerDisplayName, report.targetOwnerAuthAccountId)} />
          {report.targetType === "comment" ? <DetailRow label="Comment" value={snapshotValue(snapshot, "body") || "No comment snapshot"} /> : null}
          <DetailRow label="Snapshot" value={snapshotSummary(snapshot)} />
        </div>
        <Textarea value={note} maxLength={1000} rows={3} placeholder="Optional moderator note" onChange={(event) => onNote(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          {report.targetType === "asset" && report.status === "open" && canModerateAssets(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => setConfirmAction("hide-asset")}><EyeOff className="h-4 w-4" />HIDE</Button> : null}
          {report.targetType === "asset" && report.status === "open" && canModerateAssets(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => setConfirmAction("delete-asset")}><Trash2 className="h-4 w-4" />DELETE</Button> : null}
          {report.targetType === "comment" && report.status === "open" && canModerateComments(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => setConfirmAction("hide-comment")}><EyeOff className="h-4 w-4" />HIDE</Button> : null}
          {report.targetType === "account" && report.status === "open" && canRestrictUsers(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="secondary" disabled={run.isPending} onClick={() => { setAccountRestrictionKind("suspension"); setAccountRestrictionReason(report.details || "Workshop account report."); setAccountRestrictionExpiresAt(defaultExpiryLocal()); }}><Ban className="h-4 w-4" />SUSPEND</Button> : null}
          {report.targetType === "account" && report.status === "open" && canRestrictUsers(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => { setAccountRestrictionKind("ban"); setAccountRestrictionReason(report.details || "Workshop account report."); }}><Ban className="h-4 w-4" />BAN</Button> : null}
          {canResolveReports(permissionSource) && report.status === "open" ? <Button size="sm" variant="ghost" disabled={run.isPending} onClick={() => run.mutate("dismiss")}>DISMISS</Button> : null}
        </div>
      </CardContent>
    </Card>
    <ConfirmDialog
      open={confirmAction !== null}
      title={confirmTitle(confirmAction)}
      description={confirmDescription(confirmAction)}
      confirmLabel={confirmLabel(confirmAction)}
      busy={run.isPending}
      onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
      onConfirm={() => { if (confirmAction) run.mutate(confirmAction); }}
    />
    <AccountRestrictionDialog
      kind={accountRestrictionKind}
      reason={accountRestrictionReason}
      expiresAt={accountRestrictionExpiresAt}
      busy={run.isPending}
      onKind={setAccountRestrictionKind}
      onReason={setAccountRestrictionReason}
      onExpiresAt={setAccountRestrictionExpiresAt}
      onOpenChange={(open) => { if (!open) setAccountRestrictionKind(null); }}
      onConfirm={() => run.mutate(accountRestrictionKind === "ban" ? "ban-account" : "suspend-account")}
    />
    </>
  );
}
