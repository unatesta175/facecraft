import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  createLabel?: string;
  onCreate?: () => void;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, createLabel = 'Create', onCreate, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[--color-text-primary]">{title}</h1>
        {subtitle && <p className="text-sm text-[--color-text-secondary] mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onCreate && (
          <Button onClick={onCreate} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            {createLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
