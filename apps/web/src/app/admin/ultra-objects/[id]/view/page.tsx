'use client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil, Layers } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { AdminImagePreview, AdminImageThumb } from '@/components/admin/admin-image';

export default function UltraObjectViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: uo, isLoading, error } = useAdminData(() => adminApi.getUltraObject(params.id), [params.id]);
  const { data: objects } = useAdminData(() => adminApi.getObjects(), []);
  const objectList = objects ?? [];

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">{label}</Label><div className="text-sm font-medium text-[--color-text-primary] bg-[--color-surface-muted] rounded-lg px-3 py-2.5 border border-[--color-border]">{value}</div></div>
  );

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!uo) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div className="flex-1"><h1 className="text-xl font-semibold text-[--color-text-primary]">View Ultra Object</h1></div>
          <Button onClick={() => router.push(`/admin/ultra-objects/${uo.id}/edit`)} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
        </div>
        <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">Ultra Object Image</Label>
            <AdminImagePreview src={uo.imageUrl} alt={uo.title} />
          </div>
          <Field label="Title" value={uo.title} />
          <Field label="Description" value={uo.description ?? '—'} />
          <div className="space-y-1.5"><Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">Status</Label><div className="pt-1"><StatusBadge status={uo.status} /></div></div>
          <div className="space-y-2">
            <Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">Object Masters</Label>
            <div className="flex flex-col gap-2 pt-1">
              {uo.objectIds.map((oid) => {
                const obj = objectList.find((o) => o.id === oid);
                return (
                  <div key={oid} className="flex items-center gap-3 bg-[--color-surface-muted] rounded-lg px-3 py-2 border border-[--color-border]">
                    <AdminImageThumb src={obj?.imageUrl} alt={obj?.title ?? oid} fallback={Layers} />
                    <span className="text-sm font-medium text-[--color-text-primary]">{obj?.title ?? oid}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
