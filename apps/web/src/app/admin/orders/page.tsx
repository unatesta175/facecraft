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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminData } from '@/hooks/use-admin-data';
import { adminApi } from '@/lib/admin-api';

const PER_PAGE = 10;

export default function OrdersPage() {
  const router = useRouter();
  const { data: ordersData, isLoading: ordersLoading, reload: reloadOrders } = useAdminData(() => adminApi.getOrders(), []);
  const { data: kiosksData, isLoading: kiosksLoading, reload: reloadKiosks } = useAdminData(() => adminApi.getKiosks(), []);
  const orders = ordersData ?? [];
  const kiosks = kiosksData ?? [];
  const isLoading = ordersLoading || kiosksLoading;

  const [search, setSearch] = useState('');
  const [filterKiosk, setFilterKiosk] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);

  const reload = () => {
    reloadOrders();
    reloadKiosks();
  };

  const filtered = orders.filter((o) => {
    const matchOrderId = !search || o.orderCode.toLowerCase().includes(search.toLowerCase());
    const matchKiosk = filterKiosk === 'all' || o.kioskId === filterKiosk;
    const matchDate = !filterDate || o.date === filterDate;
    return matchOrderId && matchKiosk && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="Order Management" subtitle="View and manage all customer orders" />

        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[--color-border] flex flex-wrap gap-3">
            <Select
              value={filterKiosk}
              onValueChange={(v) => {
                setFilterKiosk(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Kiosks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kiosks</SelectItem>
                {kiosks.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="w-44"
            />
            {(filterKiosk !== 'all' || filterDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterKiosk('all');
                  setFilterDate('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
          <TableToolbar
            searchValue={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onRefresh={() => {
              reload();
              toast({ title: 'Refreshed' });
            }}
            onExport={() => toast({ title: 'Exporting…', description: 'Orders exported to Excel' })}
            searchPlaceholder="Search Order ID…"
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-[--color-text-secondary] py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-[--color-text-secondary] py-8">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((o, i) => (
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
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
