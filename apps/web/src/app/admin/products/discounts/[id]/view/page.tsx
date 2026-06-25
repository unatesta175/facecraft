'use client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';

export default function DiscountViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: item, isLoading, error } = useAdminData(() => adminApi.getDiscount(params.id), [params.id]);

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">{label}</Label><div className="text-sm font-medium text-[--color-text-primary] bg-[--color-surface-muted] rounded-lg px-3 py-2.5 border border-[--color-border]">{value}</div></div>
  );

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!item) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div className="flex-1"><h1 className="text-xl font-semibold text-[--color-text-primary]">View Discount</h1></div>
          <Button onClick={() => router.push(`/admin/products/discounts/${item.id}/edit`)} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
        </div>
        <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <Field label="Code" value={<span className="font-mono">{item.code}</span>} />
          <Field label="Amount" value={`RM ${Number(item.amount).toFixed(2)}`} />
          <Field label="Description" value={item.description ?? '—'} />
          <Field label="Created At" value={new Date(item.createdAt).toLocaleDateString()} />
        </div>
      </div>
    </AdminLayout>
  );
}
