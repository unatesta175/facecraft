'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin-api';
import { getApiErrorMessage } from '@/lib/api-error';

export default function FrameNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminApi.createFrame({ name: form.name, status: form.status, imageUrl: null });
      toast({ title: 'Frame Created', description: `Frame "${form.name}" created successfully.` });
      router.push('/admin/frames');
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
          <h1 className="text-xl font-semibold text-[--color-text-primary]">Add Frame</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">
          <div className="space-y-2"><Label>Frame Name <span className="text-red-500">*</span></Label><Input placeholder="e.g. Classic Gold Border" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-2">
            <Label>Status <span className="text-red-500">*</span></Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Frame Image</Label>
            <div className="border-2 border-dashed border-[--color-border] rounded-lg p-8 text-center hover:border-[--color-gold] transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-[--color-text-secondary] mx-auto mb-2" />
              <p className="text-sm text-[--color-text-secondary]">Drag & drop or click to upload</p>
              <p className="text-xs text-[--color-text-secondary] mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">{saving ? 'Creating…' : 'Create Frame'}</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
