'use client';
import { useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { StatusBadge } from '@/components/admin/status-badge';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { TablePagination } from '@/components/admin/table-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, TrendingUp, Receipt } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MOCK_ORDERS, MOCK_KIOSKS } from '@/lib/mock-data';

const PER_PAGE = 10;

export default function KioskReportPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterKiosk, setFilterKiosk] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const completed = MOCK_ORDERS.filter((o) => o.paymentStatus === 'COMPLETED');
  const totalAmount = MOCK_ORDERS.reduce((s, o) => s + Number(o.price), 0);

  const stats = [
    { label: 'Total Orders', value: MOCK_ORDERS.length, icon: Monitor },
    { label: 'Total Transactions', value: completed.length, icon: Receipt },
    { label: 'Total Amount', value: `RM ${totalAmount.toFixed(2)}`, icon: TrendingUp },
  ];

  const filtered = MOCK_ORDERS.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.kioskName.toLowerCase().includes(q) || o.orderCode.toLowerCase().includes(q);
    const matchKiosk = !filterKiosk || o.kioskName === filterKiosk;
    const matchStatus = !filterStatus || o.paymentStatus === filterStatus;
    const matchPayment = !filterPayment || o.paymentType === filterPayment;
    return matchSearch && matchKiosk && matchStatus && matchPayment;
  });

  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[--color-text-primary]">Kiosk Report</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">Orders breakdown by kiosk</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-[--color-border] rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[--color-gold-tint] flex items-center justify-center">
                <s.icon className="h-5 w-5 text-[--color-gold]" />
              </div>
              <div>
                <p className="text-xs text-[--color-text-secondary]">{s.label}</p>
                <p className="text-xl font-semibold text-[--color-text-primary] mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[--color-border] flex flex-wrap gap-3">
            <Select value={filterKiosk} onValueChange={setFilterKiosk}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Kiosks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Kiosks</SelectItem>
                {MOCK_KIOSKS.map((k) => <SelectItem key={k.id} value={k.name}>{k.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Payment Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TableToolbar searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} onRefresh={() => toast({ title: 'Refreshed' })} onExport={() => toast({ title: 'Exporting…' })} searchPlaceholder="Search kiosk or order ID…" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Kiosk Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o, i) => (
                <TableRow key={o.id}>
                  <TableCell className="text-[--color-text-secondary]">{(page - 1) * PER_PAGE + i + 1}</TableCell>
                  <TableCell className="font-medium">{o.kioskName}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{o.date}</TableCell>
                  <TableCell className="text-sm text-[--color-text-secondary]">{o.time}</TableCell>
                  <TableCell><StatusBadge status={o.paymentType} /></TableCell>
                  <TableCell className="font-medium">RM {Number(o.price).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))} totalItems={filtered.length} itemsPerPage={PER_PAGE} onPageChange={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}
