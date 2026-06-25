'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { getApiErrorMessage } from '@/lib/api-error';

export default function FrameEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: frame, isLoading, error } = useAdminData(() => adminApi.getFrame(params.id), [params.id]);
  const [form, setForm] = useState<{ name: string; status: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (frame) {
      setForm({ name: frame.name, status: frame.status });
    }
  }, [frame]);

  const confirmUpdate = async () => {
    if (!form) return;
    try {
      setSaving(true);
      await adminApi.updateFrame(params.id, { name: form.name, status: form.status, imageUrl: null });
      toast({ title: 'Frame Updated', description: `Frame "${form.name}" updated successfully.` });
      router.push('/admin/frames');
    } catch (err) {
      toast({ title: 'Update Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!frame || !form) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Frame</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="space-y-2"><Label>Frame Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-2">
            <Label>Status <span className="text-red-500">*</span></Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Change Image</Label>
            <div className="border-2 border-dashed border-[--color-border] rounded-lg p-6 text-center hover:border-[--color-gold] transition-colors cursor-pointer">
              <Upload className="h-6 w-6 text-[--color-text-secondary] mx-auto mb-1" />
              <p className="text-sm text-[--color-text-secondary]">Click to change image</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Frame</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Frame" description={`Save changes to "${form.name}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
