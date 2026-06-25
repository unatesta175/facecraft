'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { getApiErrorMessage } from '@/lib/api-error';
import { assetsApi } from '@/lib/assets-api';
import { AdminImageUpload, useAdminImageUpload } from '@/components/admin/admin-image-upload';

export default function KioskNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', password: '', confirmPassword: '', description: '', status: 'ACTIVE' });
  const { file, removeExisting, onImageChange } = useAdminImageUpload();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setErr('Passwords do not match'); return; }
    setErr('');
    setSaving(true);
    try {
      let profileImageUrl: string | null = null;
      if (file) {
        profileImageUrl = await assetsApi.uploadCatalogImage('profiles', file);
      }
      await adminApi.createKiosk({
        name: form.name,
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
        description: form.description || null,
        status: form.status,
        profileImageUrl,
      });
      toast({ title: 'Kiosk Created', description: `Kiosk "${form.name}" created successfully.` });
      router.push('/admin/kiosks');
    } catch (err) {
      toast({ title: 'Create Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Add Kiosk</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          {err && <p className="text-sm text-[--color-danger-text] bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Kiosk Name <span className="text-red-500">*</span></Label><Input placeholder="e.g. Main Lobby Kiosk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Username <span className="text-red-500">*</span></Label><Input placeholder="e.g. kiosk01" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Password <span className="text-red-500">*</span></Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Confirm Password <span className="text-red-500">*</span></Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></div>
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
            file={file}
            removeExisting={removeExisting}
            onChange={onImageChange}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">{saving ? 'Creating…' : 'Create Kiosk'}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
