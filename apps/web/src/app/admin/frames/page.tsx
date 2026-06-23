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
import { toast } from '@/hooks/use-toast';
import { MOCK_FRAMES } from '@/lib/mock-data';

const PER_PAGE = 10;

export default function FramesPage() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_FRAMES);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Frames Master" subtitle="Manage photo frame overlays" onCreate={() => router.push('/admin/frames/new')} />
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => toast({ title: 'Refreshed' })} onExport={() => toast({ title: 'Exporting…' })} searchPlaceholder="Search frame name…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Frame Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f, i) => (
                <TableRow key={f.id}>
                  <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{new Date(f.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge status={f.status} /></TableCell>
                  <TableCell><RowActions onView={() => router.push(`/admin/frames/${f.id}/view`)} onEdit={() => router.push(`/admin/frames/${f.id}/edit`)} onDelete={() => setDeleteId(f.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Frame" description="Delete this frame?" confirmLabel="Delete" onConfirm={() => { setItems((p) => p.filter((f) => f.id !== deleteId)); toast({ title: 'Frame Deleted' }); setDeleteId(null); }} />
    </AdminLayout>
  );
}
