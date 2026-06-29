import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE:     { label: 'Active',     className: 'bg-[--color-success-bg] text-[--color-success-text] hover:bg-[#e4ebd6] hover:text-[#385a2c]' },
  INACTIVE:   { label: 'Inactive',   className: 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600' },
  COMPLETED:  { label: 'Completed',  className: 'bg-[--color-success-bg] text-[--color-success-text] hover:bg-[#e4ebd6] hover:text-[#385a2c]' },
  PENDING:    { label: 'Pending',    className: 'bg-[--color-gold-tint] text-[--color-gold-tint-text] hover:bg-[#f5e8a8] hover:text-[#6b4a22]' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-red-50 text-[--color-danger-text] hover:bg-red-100 hover:text-red-700' },
  CASH:       { label: 'Cash',       className: 'bg-[--color-chocolate-tint] text-[--color-chocolate] hover:bg-[#eedfc0] hover:text-[#6a4924]' },
  CARD:       { label: 'Card',       className: 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700' },
  QR:         { label: 'QR',         className: 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700' };
  return (
    <Badge variant="label" className={cn('rounded-full text-xs font-medium px-2.5 py-0.5', config.className, className)}>
      {config.label}
    </Badge>
  );
}
