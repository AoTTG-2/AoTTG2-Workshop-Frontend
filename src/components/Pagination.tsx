"use client";

import { Button } from "@aottg2/ui";
import { paginationItems } from "../lib/pagination";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  className?: string;
}

export function Pagination({ page, total, pageSize, onPage, className = "" }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(1, page), totalPages);

  return (
    <nav className={`flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 ${className}`} aria-label="Pagination">
      <span className="text-sm text-muted-foreground">Page {current} of {totalPages}</span>
      <div className="flex flex-wrap items-center gap-1 font-primary">
        <PaginationButton disabled={current <= 1} onClick={() => onPage(current - 1)}>
          Prev
        </PaginationButton>
        {paginationItems(current, totalPages).map((item, index) => item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="grid h-9 min-w-9 place-items-center px-2 text-sm text-muted-foreground" aria-hidden="true">...</span>
        ) : (
          <PaginationButton key={item} current={item === current} onClick={() => onPage(item)}>
            {item}
          </PaginationButton>
        ))}
        <PaginationButton disabled={current >= totalPages} onClick={() => onPage(current + 1)}>
          Next
        </PaginationButton>
      </div>
    </nav>
  );
}

function PaginationButton({ children, current = false, disabled = false, onClick }: { children: number | string; current?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={current ? "default" : "ghost"}
      className="h-9 min-w-9 px-2 font-primary text-sm"
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
