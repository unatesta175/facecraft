'use client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { AdminImagePreview, AdminImageThumb } from '@/components/admin/admin-image';
import { Package } from 'lucide-react';

export default function ComboViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: combo, isLoading, error } = useAdminData(() => adminApi.getCombo(params.id), [params.id]);

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">{label}</Label>
      <div className="text-sm font-medium text-[--color-text-primary] bg-[--color-surface-muted] rounded-lg px-3 py-2.5 border border-[--color-border]">{value}</div>
    </div>
  );

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!combo) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[--color-text-primary]">View Combo Product</h1>
          </div>
          <Button onClick={() => router.push(`/admin/products/combo/${combo.id}/edit`)} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
        <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">Combo Image</Label>
            <AdminImagePreview src={combo.thumbnailUrl} alt={combo.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Combo Name" value={combo.name} />
            <Field label="Price" value={`RM ${Number(combo.price).toFixed(2)}`} />
          </div>
          <Field label="Description" value={combo.description ?? '—'} />
          <div className="space-y-1.5">
            <Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">Status</Label>
            <div className="pt-1"><StatusBadge status={combo.status} /></div>
          </div>
          <div className="space-y-2">
            <Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">
              Included Products ({combo.items.length})
            </Label>
            {combo.items.length === 0 ? (
              <div className="text-sm text-[--color-text-secondary] bg-[--color-surface-muted] rounded-lg px-3 py-4 border border-[--color-border]">
                No products linked to this combo.
              </div>
            ) : (
              <div className="space-y-2">
                {combo.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 bg-[--color-surface-muted] rounded-lg px-3 py-2.5 border border-[--color-border]"
                  >
                    <AdminImageThumb
                      src={item.productImageUrl}
                      alt={item.productName ?? item.productId}
                      fallback={Package}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[--color-text-primary] truncate">
                        {item.productName ?? item.productId}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[--color-text-secondary] bg-white px-2 py-1 rounded border border-[--color-border]">
                      Qty {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
