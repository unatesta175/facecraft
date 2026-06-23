'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin-layout';
import { PageHeader } from '@/components/admin/page-header';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { StatusBadge } from '@/components/admin/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_ORDERS } from '@/lib/mock-data';

const PER_PAGE = 10;

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = MOCK_ORDERS.filter(
    (o) => o.orderCode.toLowerCase().includes(search.toLowerCase()) || o.kioskName.toLowerCase().includes(search.toLowerCase()) || o.staffId.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Order Management" subtitle="View and manage all customer orders" />

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <TableToolbar
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onRefresh={() => toast({ title: 'Refreshed', description: 'Order list updated' })}
            onExport={() => toast({ title: 'Exporting…', description: 'Orders exported to Excel' })}
            searchPlaceholder="Search Order ID, Kiosk, Staff ID…"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Kiosk Name</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o, i) => (
                <TableRow key={o.id}>
                  <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                  <TableCell className="font-medium text-sm">{o.kioskName}</TableCell>
                  <TableCell className="font-mono text-xs">{o.orderCode}</TableCell>
                  <TableCell className="text-sm">{o.staffId}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{o.date}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{o.time}</TableCell>
                  <TableCell><StatusBadge status={o.paymentType} /></TableCell>
                  <TableCell className="font-medium">RM {Number(o.price).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}
