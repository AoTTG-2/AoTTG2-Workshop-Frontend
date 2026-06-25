import type { WorkshopReport } from "@/lib/api/workshop";
import { EmptyPanel, ListTitle, LoadingPanel, listItemClass } from "./Common";
import { formatDate, targetTitle } from "../utils";

export function ReportList({ reports, selectedId, loading, error, onSelect }: { reports: WorkshopReport[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Reports unavailable" text="Could not load moderation reports." />;
  if (!reports.length) return <EmptyPanel title="No reports" text="Nothing matches this queue." />;
  return (
    <div className="grid content-start gap-3">
      {reports.map((report) => (
        <button key={report.id} type="button" className={listItemClass(selectedId === report.id)} onClick={() => onSelect(report.id)}>
          <ListTitle title={targetTitle(report)} badge={report.status} dot={report.status === "open"} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>{report.reason}</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
