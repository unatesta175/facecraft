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



export default function ObjectNewPage() {

  const router = useRouter();

  const [form, setForm] = useState({ title: '', description: '', status: 'ACTIVE' });

  const { file, removeExisting, onImageChange } = useAdminImageUpload();

  const [saving, setSaving] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setSaving(true);

    try {

      let imageUrl: string | null = null;

      if (file) {

        imageUrl = await assetsApi.uploadCatalogImage('objects', file);

      }

      await adminApi.createObject({

        title: form.title,

        description: form.description || null,

        status: form.status,

        imageUrl,

      });

      toast({ title: 'Object Created', description: `"${form.title}" created successfully.` });

      router.push('/admin/objects');

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

          <h1 className="text-xl font-semibold text-[--color-text-primary]">Add Object</h1>

        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[--color-border] rounded-xl p-6 space-y-5">

          <div className="space-y-2"><Label>Title <span className="text-red-500">*</span></Label><Input placeholder="e.g. Rose Bouquet" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>

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

            file={file}

            removeExisting={removeExisting}

            onChange={onImageChange}

          />

          <div className="flex justify-end gap-3 pt-2">

            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>

            <Button type="submit" disabled={saving} className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">{saving ? 'Creating…' : 'Create Object'}</Button>

          </div>

        </form>

      </div>

    </AdminLayout>

  );

}


