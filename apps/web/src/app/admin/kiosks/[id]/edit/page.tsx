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

export default function KioskEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: kiosk, isLoading, error } = useAdminData(() => adminApi.getKiosk(params.id), [params.id]);
  const [form, setForm] = useState<{ name: string; username: string; password: string; confirmPassword: string; description: string; status: string } | null>(null);
  const { file, removeExisting, onImageChange } = useAdminImageUpload();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (kiosk) {
      setForm({
        name: kiosk.name,
        username: kiosk.username,
        password: '',
        confirmPassword: '',
        description: kiosk.description ?? '',
        status: kiosk.status,
      });
    }
  }, [kiosk]);

  const confirmUpdate = async () => {
    if (!form || !kiosk) return;
    if (form.password && form.password !== form.confirmPassword) {
      toast({ title: 'Validation Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const profileImageUrl = await resolveImageField('profiles', file, removeExisting, Boolean(kiosk.profileImageUrl));
      const payload: Record<string, unknown> = {
        name: form.name,
        username: form.username,
        description: form.description || null,
        status: form.status,
        ...(form.password ? { password: form.password, confirmPassword: form.confirmPassword } : {}),
      };
      if (profileImageUrl !== undefined) payload.profileImageUrl = profileImageUrl;

      await adminApi.updateKiosk(params.id, payload);
      toast({ title: 'Kiosk Updated', description: `Kiosk "${form.name}" updated successfully.` });
      router.push('/admin/kiosks');
    } catch (err) {
      toast({ title: 'Update Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;
  if (!kiosk || !form) return <AdminLayout><div className="p-8">{error ?? 'Not found'}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Edit Kiosk — {kiosk.name}</h1>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Kiosk Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Username <span className="text-red-500">*</span></Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Leave blank to keep" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <Label>Status <span className="text-red-500">*</span></Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <AdminImageUpload
            label="Kiosk Image"
            existingUrl={kiosk.profileImageUrl}
            file={file}
            removeExisting={removeExisting}
            onChange={onImageChange}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">Update Kiosk</Button>
          </div>
        </form>
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Update Kiosk" description={`Save changes to "${form.name}"?`} confirmLabel="Update" confirmVariant="gold" onConfirm={confirmUpdate} loading={saving} />
    </AdminLayout>
  );
}
