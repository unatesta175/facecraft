'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { PageHeader } from '@/components/admin/page-header';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { RowActions } from '@/components/admin/row-actions';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/use-admin-data';
import { adminApi } from '@/lib/admin-api';
import { AdminImageThumb } from '@/components/admin/admin-image';
import { getApiErrorMessage } from '@/lib/api-error';

const PER_PAGE = 10;

export default function PhotographersPage() {
  const router = useRouter();
  const { data: items, isLoading, reload } = useAdminData(() => adminApi.getPhotographers(), [], []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteUser(deleteId);
      toast({ title: 'Photographer Deleted' });
      setDeleteId(null);
      reload();
    } catch (err) {
      toast({ title: 'Delete Failed', description: getApiErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Photographer Master" subtitle="Manage staff photographers" onCreate={() => router.push('/admin/photographers/new')} />
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => { reload(); toast({ title: 'Refreshed' }); }} onExport={() => toast({ title: 'Exporting…' })} searchPlaceholder="Search name or email…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-14">Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-[--color-text-secondary] py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-[--color-text-secondary] py-8">
                    No photographers found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u, i) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                    <TableCell>
                      <AdminImageThumb src={u.profileImageUrl} alt={u.name} fallback={Camera} />
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm font-mono text-[--color-text-secondary]">{u.username}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{u.phone}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{u.email}</TableCell>
                    <TableCell className="text-sm text-[--color-text-secondary]">{u.locationArea}</TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                    <TableCell><RowActions onView={() => router.push(`/admin/photographers/${u.id}/view`)} onPhotos={() => router.push(`/admin/photographers/${u.id}/photos`)} onEdit={() => router.push(`/admin/photographers/${u.id}/edit`)} onDelete={() => setDeleteId(u.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Photographer" description="Delete this photographer account?" confirmLabel="Delete" onConfirm={confirmDelete} />
    </AdminLayout>
  );
}
