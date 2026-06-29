'use client';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: TablePaginationProps) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="p-4 border-t border-[--color-border] flex items-center justify-between flex-wrap gap-3">
      <p className="text-sm text-[--color-text-secondary]">
        Showing {totalItems === 0 ? 0 : start} to {end} of {totalItems} entries
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          &lsaquo;
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            className={page === currentPage ? 'bg-[--color-gold] hover:bg-[--color-gold-hover] text-white min-w-[36px]' : 'min-w-[36px] hover:bg-[--color-surface-muted]'}
          >
            {page}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
          &rsaquo;
        </Button>
      </div>
    </div>
  );
}
