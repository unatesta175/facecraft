'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_SIZES } from '@/lib/mock-data';

export default function SizeEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const size = MOCK_SIZES.find((s) => s.id === params.id) ?? MOCK_SIZES[0];
  const [form, setForm] = useState({ height: String(size.height), width: String(size.width) });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const confirmUpdate = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: 'Size Updated', description: `Size updated to ${form.height}" × ${form.width}".` });
    setConfirmOpen(false);
    router.push('/admin/products/sizes');
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Size</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (inches) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Width (inches) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Size</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Size" description={`Save changes to size ${form.height}" × ${form.width}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
