'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { getApiErrorMessage } from '@/lib/api-error';

export default function DiscountEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: item, isLoading, error } = useAdminData(() => adminApi.getDiscount(params.id), [params.id]);
  const [form, setForm] = useState<{ code: string; amount: string; description: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ code: item.code, amount: String(item.amount), description: item.description ?? '' });
    }
  }, [item]);

  const confirmUpdate = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await adminApi.updateDiscount(params.id, {
        code: form.code.toUpperCase(),
        amount: Number(form.amount),
        description: form.description || null,
      });
      toast({ title: 'Discount Updated', description: `Discount "${form.code}" updated successfully.` });
      router.push('/admin/products/discounts');
    } catch (err) {
      toast({ title: 'Update Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!item || !form) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Discount</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="space-y-2"><Label>Code <span className="text-red-500">*</span></Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
          <div className="space-y-2"><Label>Amount (RM) <span className="text-red-500">*</span></Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Discount</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Discount" description={`Save changes to "${form.code}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
