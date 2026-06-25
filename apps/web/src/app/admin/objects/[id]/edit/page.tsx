'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { useAdminData } from '@/hooks/use-admin-data';
import { getApiErrorMessage } from '@/lib/api-error';
import { resolveImageField } from '@/lib/assets-api';
import { AdminImageUpload, useAdminImageUpload } from '@/components/admin/admin-image-upload';

export default function ObjectEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: obj, isLoading, error } = useAdminData(() => adminApi.getObject(params.id), [params.id]);
  const [form, setForm] = useState<{ title: string; description: string; status: string } | null>(null);
  const { file, removeExisting, onImageChange } = useAdminImageUpload();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (obj) {
      setForm({ title: obj.title, description: obj.description ?? '', status: obj.status });
    }
  }, [obj]);

  const confirmUpdate = async () => {
    if (!form || !obj) return;
    setSaving(true);
    try {
      const imageUrl = await resolveImageField('objects', file, removeExisting, Boolean(obj.imageUrl));
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        status: form.status,
      };
      if (imageUrl !== undefined) payload.imageUrl = imageUrl;

      await adminApi.updateObject(params.id, payload);
      toast({ title: 'Object Updated', description: `"${form.title}" updated successfully.` });
      router.push('/admin/objects');
    } catch (err) {
      toast({ title: 'Update Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!obj || !form) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Object</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="space-y-2"><Label>Title <span className="text-red-500">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="space-y-2">
            <Label>Status <span className="text-red-500">*</span></Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <AdminImageUpload
            label="Object Image"
            hint="PNG with transparency recommended"
            existingUrl={obj.imageUrl}
            file={file}
            removeExisting={removeExisting}
            onChange={onImageChange}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Object</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Object" description={`Save changes to "${form.title}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
