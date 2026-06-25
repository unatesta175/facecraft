'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { getApiErrorMessage } from '@/lib/api-error';
import { assetsApi } from '@/lib/assets-api';
import { AdminImageUpload, useAdminImageUpload } from '@/components/admin/admin-image-upload';

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ACCOUNT_MANAGER', label: 'Account Manager' },
  { value: 'STAFF', label: 'Staff' },
];

export default function RoleNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', locationArea: '', role: 'STAFF', staffCode: '', username: '', password: '', confirmPassword: '', status: 'ACTIVE' });
  const { file, removeExisting, onImageChange } = useAdminImageUpload();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Validation Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let profileImageUrl: string | null = null;
      if (file) {
        profileImageUrl = await assetsApi.uploadCatalogImage('profiles', file);
      }
      await adminApi.createUser({
        name: form.name,
        phone: form.phone,
        email: form.email,
        locationArea: form.locationArea,
        role: form.role,
        staffCode: form.staffCode,
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
        status: form.status,
        isPhotographer: false,
        profileImageUrl,
      });
      toast({ title: 'User Created', description: `"${form.name}" created successfully.` });
      router.push('/admin/roles');
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
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Add User</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name <span className="text-red-500">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Phone Number <span className="text-red-500">*</span></Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email ID <span className="text-red-500">*</span></Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Location Area <span className="text-red-500">*</span></Label><Input value={form.locationArea} onChange={(e) => setForm({ ...form, locationArea: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>User Type <span className="text-red-500">*</span></Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>User ID (Staff Code) <span className="text-red-500">*</span></Label><Input placeholder="e.g. Fc107" value={form.staffCode} onChange={(e) => setForm({ ...form, staffCode: e.target.value })} required /></div>
          </div>
          <div className="space-y-2"><Label>Username <span className="text-red-500">*</span></Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Password <span className="text-red-500">*</span></Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Confirm Password <span className="text-red-500">*</span></Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></div>
          </div>
          <AdminImageUpload
            label="Profile Photo"
            file={file}
            removeExisting={removeExisting}
            onChange={onImageChange}
          />
          <div className="space-y-2">
            <Label>Status <span className="text-red-500">*</span></Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">{saving ? 'Creating…' : 'Create User'}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
