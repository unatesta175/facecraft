'use client';
import { ReactNode } from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  extraActions?: ReactNode;
}

export function TableToolbar({ searchValue, onSearchChange, onRefresh, onExport, searchPlaceholder = 'Search...', extraActions }: TableToolbarProps) {
  return (
    <div className="p-4 border-b border-[--color-border] flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--color-text-secondary]" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" onClick={onRefresh} className="text-[--color-gold] border-[--color-border] hover:bg-[--color-surface-muted]">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      {onExport && (
        <Button variant="outline" onClick={onExport} className="text-[--color-gold] border-[--color-border] hover:bg-[--color-surface-muted]">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      )}
      {extraActions}
    </div>
  );
}
