import { Badge, Button, Card, CardContent, CardHeader, CardTitle, SearchInput, Spinner } from "@aottg2/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { getAccessToken } from "@/auth/storage";
import { useAuth } from "@/auth/useAuth";
import { canRestrictUsers } from "@/auth/workshopPermissions";
import { getModerationUser, liftAuthAccountRestriction, restrictAuthAccount, type ModerationUser, type ModerationUserDetail } from "@/lib/api/workshop";
import { toast } from "@/lib/toast";
import type { RestrictionKindDraft } from "../types";
import { AccountRestrictionDialog, DetailRow, EmptyPanel, ListTitle, LoadingPanel, listItemClass } from "./Common";
import { defaultExpiryLocal, formatDate } from "../utils";

export function UserQueueSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Card>
      <CardContent className="p-3">
        <SearchInput value={value} onChange={(event: { target: { value: string } }) => onChange(event.target.value)} onClear={() => onChange("")} placeholder="Search reported users" className="max-w-none" />
      </CardContent>
    </Card>
  );
}

export function UserList({ users, selectedId, loading, error, onSelect }: { users: ModerationUser[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Users unavailable" text="Could not load reported users." />;
  if (!users.length) return <EmptyPanel title="No reported users" text="Account and owner reports will appear here." />;
  return (
    <div className="grid content-start gap-3">
      {users.map((user) => (
        <button key={user.authAccountId} type="button" className={listItemClass(selectedId === user.authAccountId)} onClick={() => onSelect(user.authAccountId)}>
          <ListTitle title={user.displayName} badge={`${user.openReportCount} open`} dot={user.openReportCount > 0} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>{user.creatorName ? `/${user.creatorName}` : user.authAccountId}</span>
            <span>{user.assetCount} assets</span>
            <span>{user.commentCount} comments</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function UserDetail({ user, onDone }: { user: ModerationUser | null; onDone: () => void }) {
  const { profile, workshopUser } = useAuth();
  const permissionSource = workshopUser ?? profile;
  const token = getAccessToken();
  const [dialogKind, setDialogKind] = useState<RestrictionKindDraft | null>(null);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState(defaultExpiryLocal());
  const canRestrict = canRestrictUsers(permissionSource);
  const detailQuery = useQuery({
    queryKey: ["workshop", "moderation", "users", user?.authAccountId, "detail"],
    queryFn: () => getModerationUser(token!, user!.authAccountId),
    enabled: Boolean(token && user?.authAccountId),
  });
  const detail = detailQuery.data;
  const restrict = useMutation({
    mutationFn: async () => {
      if (!token || !user || !dialogKind) return;
      const end = dialogKind === "suspension" ? new Date(expiresAt) : null;
      if (dialogKind === "suspension" && (!end || Number.isNaN(end.getTime()) || end <= new Date())) throw new Error("Choose a future suspension end time.");
      await restrictAuthAccount(token, user.authAccountId, { kind: dialogKind, reason: reason.trim(), expiresAt: end?.toISOString() ?? null });
    },
    onSuccess: () => {
      toast.success(dialogKind === "ban" ? "User banned" : "User suspended", { description: "Auth-service restriction saved." });
      setDialogKind(null);
      setReason("");
      onDone();
    },
    onError: (error) => toast.error("Restriction failed", { description: error instanceof Error ? error.message : "Try again." }),
  });
  const lift = useMutation({
    mutationFn: () => liftAuthAccountRestriction(token!, user!.authAccountId),
    onSuccess: () => {
      toast.success("Restriction lifted", { description: "Auth-service restriction cleared." });
      onDone();
    },
    onError: (error) => toast.error("Lift failed", { description: error instanceof Error ? error.message : "Try again." }),
  });

  if (!user) return <EmptyPanel title="Select a user" text="Choose a reported account from the queue." />;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{user.displayName}</CardTitle>
          <Badge variant={user.openReportCount > 0 ? "secondary" : "outline"}>{user.openReportCount} open reports</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <DetailRow label="Account" value={user.authAccountId} />
          <DetailRow label="Creator" value={user.creatorName ? `/${user.creatorName}` : "No creator name"} />
          <DetailRow label="Activity" value={`${user.assetCount} assets, ${user.hiddenAssetCount} hidden, ${user.deletedAssetCount} deleted, ${user.commentCount} comments`} />
          <DetailRow label="Last seen" value={formatDate(user.lastSeenAt)} />
        </div>
        {canRestrict ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setDialogKind("suspension"); setReason("Workshop moderation action."); setExpiresAt(defaultExpiryLocal()); }}><Ban className="h-4 w-4" />SUSPEND</Button>
            <Button size="sm" variant="destructive" onClick={() => { setDialogKind("ban"); setReason("Workshop moderation action."); }}><Ban className="h-4 w-4" />BAN</Button>
            <Button size="sm" variant="ghost" disabled={lift.isPending} onClick={() => lift.mutate()}>LIFT</Button>
          </div>
        ) : null}
        {detailQuery.isLoading ? <Spinner label="Loading user evidence" /> : detail ? <UserEvidence detail={detail} /> : null}
      </CardContent>
      <AccountRestrictionDialog
        kind={dialogKind}
        reason={reason}
        expiresAt={expiresAt}
        busy={restrict.isPending}
        onKind={setDialogKind}
        onReason={setReason}
        onExpiresAt={setExpiresAt}
        onOpenChange={(open) => { if (!open) setDialogKind(null); }}
        onConfirm={() => restrict.mutate()}
      />
    </Card>
  );
}

function UserEvidence({ detail }: { detail: ModerationUserDetail }) {
  return (
    <div className="grid gap-4">
      <EvidenceBlock title="Recent Reports" empty="No reports.">
        {detail.recentReports.map((report) => <DetailRow key={report.id} label={report.targetType} value={`${report.reason} - ${report.status}`} />)}
      </EvidenceBlock>
      <EvidenceBlock title="Recent Assets" empty="No assets.">
        {detail.recentAssets.map((asset) => <DetailRow key={asset.id} label={asset.status} value={`${asset.title} / ${asset.assetSlug}`} />)}
      </EvidenceBlock>
      <EvidenceBlock title="Recent Comments" empty="No comments.">
        {detail.recentComments.map((comment) => <DetailRow key={comment.id} label={comment.status} value={comment.body} />)}
      </EvidenceBlock>
    </div>
  );
}

function EvidenceBlock({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  return (
    <div className="grid gap-2 rounded-md border border-border p-3">
      <h3 className="font-primary text-sm uppercase">{title}</h3>
      {Array.isArray(items) && items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : items}
    </div>
  );
}
