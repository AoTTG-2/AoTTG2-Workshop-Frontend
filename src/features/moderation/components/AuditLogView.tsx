import { Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, EmptyState, FilterBar, SearchInput, Spinner } from "@aottg2/ui";
import { Pagination } from "@/components/Pagination";
import type { WorkshopAuditEvent } from "@/lib/api/workshop";
import { auditPageSize, type AuditViewMode } from "../types";
import { formatDate, renderAuditActivity } from "../utils";

export function AuditLogView({
  events,
  error,
  eventType,
  loading,
  mode,
  page,
  total,
  onEventType,
  onMode,
  onPage,
  onRefresh,
}: {
  events: WorkshopAuditEvent[];
  error: boolean;
  eventType: string;
  loading: boolean;
  mode: AuditViewMode;
  page: number;
  total: number;
  onEventType: (value: string) => void;
  onMode: (value: AuditViewMode) => void;
  onPage: (page: number) => void;
  onRefresh: () => void;
}) {
  const columns = mode === "readable" ? [
    {
      key: "created",
      header: "Timestamp",
      cell: (event: WorkshopAuditEvent) => <span className="whitespace-nowrap tabular-nums">{formatDate(event.createdAt)}</span>,
    },
    {
      key: "activity",
      header: "Activity",
      cell: (event: WorkshopAuditEvent) => <div className="text-sm text-foreground">{renderAuditActivity(event)}</div>,
    },
  ] : [
    { key: "created", header: "Created", cell: (event: WorkshopAuditEvent) => formatDate(event.createdAt) },
    { key: "event", header: "Event", cell: (event: WorkshopAuditEvent) => <Badge variant="outline">{event.eventType}</Badge> },
    { key: "actor", header: "Actor", cell: (event: WorkshopAuditEvent) => <span className="font-mono text-xs">{event.actorAuthAccountId ?? "system"}</span> },
    { key: "target", header: "Target", cell: (event: WorkshopAuditEvent) => <span className="font-mono text-xs">{event.targetKind}:{event.targetId}</span> },
    { key: "metadata", header: "Metadata", cell: (event: WorkshopAuditEvent) => <span className="break-all font-mono text-xs text-muted-foreground">{event.metadataJson ?? "-"}</span> },
  ];

  return (
    <div className="grid gap-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CardTitle>Audit logs</CardTitle>
            <Badge variant="secondary">{total} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <FilterBar className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <SearchInput value={eventType} onChange={(event: { target: { value: string } }) => { onEventType(event.target.value); onPage(1); }} onClear={() => { onEventType(""); onPage(1); }} placeholder="Filter event type" className="max-w-none" />
            <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:pr-2">
              <Button type="button" variant={mode === "readable" ? "default" : "secondary"} onClick={() => onMode("readable")}>Readable</Button>
              <Button type="button" variant={mode === "technical" ? "default" : "secondary"} onClick={() => onMode("technical")}>Technical</Button>
              <Button type="button" variant="secondary" onClick={onRefresh}>Refresh</Button>
            </div>
          </FilterBar>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center p-6"><Spinner label="Loading audit logs" /></div>
          ) : error ? (
            <EmptyState title="Could not load audit logs" description="Try again or check your Workshop audit permission." action={<Button type="button" onClick={onRefresh}>Try again</Button>} />
          ) : (
            <DataTable className="admin-data-table" columns={columns} data={events} getRowKey={(event) => event.id} emptyTitle="No audit events" emptyDescription="Try another event type filter." />
          )}
        </CardContent>
      </Card>

      <Pagination total={total} page={page} pageSize={auditPageSize} onPage={onPage} />
    </div>
  );
}
