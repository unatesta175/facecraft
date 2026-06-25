'use client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';

export default function SizeViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: size, isLoading, error } = useAdminData(() => adminApi.getSize(params.id), [params.id]);

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-[--color-text-secondary] text-xs uppercase tracking-wide">{label}</Label><div className="text-sm font-medium text-[--color-text-primary] bg-[--color-surface-muted] rounded-lg px-3 py-2.5 border border-[--color-border]">{value}</div></div>
  );

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!size) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <div className="flex-1"><h1 className="text-xl font-semibold text-[--color-text-primary]">View Size</h1></div>
          <Button onClick={() => router.push(`/admin/products/sizes/${size.id}/edit`)} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
        </div>
        <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (inches)" value={`${size.height}"`} />
            <Field label="Width (inches)" value={`${size.width}"`} />
          </div>
          <Field label="Created At" value={new Date(size.createdAt).toLocaleDateString()} />
        </div>
      </div>
    </AdminLayout>
  );
}
