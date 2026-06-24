export type PaginationItem = number | "ellipsis";

export function paginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 0) return [];
  const current = Math.min(Math.max(1, page), totalPages);
  if (totalPages <= 7) return range(1, totalPages);
  if (current <= 3) return [1, 2, 3, "ellipsis", totalPages - 1, totalPages];
  if (current >= totalPages - 2) return [1, 2, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", totalPages];
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
