'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { getApiErrorMessage } from '@/lib/api-error';

export default function SizeNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ height: '', width: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createSize({
        height: Number(form.height),
        width: Number(form.width),
      });
      toast({ title: 'Size Created', description: `Size ${form.height}" × ${form.width}" created successfully.` });
      router.push('/admin/products/sizes');
    } catch (err) {
      toast({ title: 'Create Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Add Size</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (inches) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" placeholder="e.g. 4" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Width (inches) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" placeholder="e.g. 6" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">{saving ? 'Creating…' : 'Create Size'}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
