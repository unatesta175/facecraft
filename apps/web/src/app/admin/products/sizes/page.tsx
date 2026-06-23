'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { PageHeader } from '@/components/admin/page-header';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { RowActions } from '@/components/admin/row-actions';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { MOCK_SIZES } from '@/lib/mock-data';

const PER_PAGE = 10;

export default function SizesPage() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_SIZES);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((s) => `${s.height}x${s.width}`.includes(search));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Size Master" subtitle="Manage product print sizes" onCreate={() => router.push('/admin/products/sizes/new')} />

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => toast({ title: 'Refreshed' })} searchPlaceholder="Search dimensions…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Height (in)</TableHead>
                <TableHead>Width (in)</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                  <TableCell className="font-medium">{s.height}"</TableCell>
                  <TableCell className="font-medium">{s.width}"</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <RowActions
                      onView={() => router.push(`/admin/products/sizes/${s.id}/view`)}
                      onEdit={() => router.push(`/admin/products/sizes/${s.id}/edit`)}
                      onDelete={() => setDeleteId(s.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Size" description="Delete this size? It will also affect linked products." confirmLabel="Delete" onConfirm={() => { setItems((p) => p.filter((s) => s.id !== deleteId)); toast({ title: 'Size Deleted' }); setDeleteId(null); }} />
    </AdminLayout>
  );
}
