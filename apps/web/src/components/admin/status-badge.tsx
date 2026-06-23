import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE:     { label: 'Active',     className: 'bg-[--color-success-bg] text-[--color-success-text] border-transparent' },
  INACTIVE:   { label: 'Inactive',   className: 'bg-gray-100 text-gray-500 border-transparent' },
  COMPLETED:  { label: 'Completed',  className: 'bg-[--color-success-bg] text-[--color-success-text] border-transparent' },
  PENDING:    { label: 'Pending',    className: 'bg-[--color-gold-tint] text-[--color-gold-tint-text] border-transparent' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-red-50 text-[--color-danger-text] border-transparent' },
  CASH:       { label: 'Cash',       className: 'bg-[--color-chocolate-tint] text-[--color-chocolate] border-transparent' },
  CARD:       { label: 'Card',       className: 'bg-blue-50 text-blue-600 border-transparent' },
  QR:         { label: 'QR',         className: 'bg-purple-50 text-purple-600 border-transparent' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-transparent' };
  return (
    <Badge className={cn('rounded-full text-xs font-medium px-2.5 py-0.5', config.className, className)}>
      {config.label}
    </Badge>
  );
}
