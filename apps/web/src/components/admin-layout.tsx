'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Package, Tag, Percent, Monitor,
  Camera, Frame, Users, Box, Layers, FileText, LogOut,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavItem { label: string; href?: string; icon: any; items?: NavItem[]; }

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Order Management', href: '/admin/orders', icon: ShoppingBag },
  {
    label: 'Products', icon: Package, items: [
      { label: 'Product', href: '/admin/products', icon: Package },
      { label: 'Combo Product', href: '/admin/products/combo', icon: Layers },
      { label: 'Size Master', href: '/admin/products/sizes', icon: Tag },
      { label: 'Discount Master', href: '/admin/products/discounts', icon: Percent },
    ],
  },
  {
    label: 'Masters', icon: Monitor, items: [
      { label: 'Kiosk Master', href: '/admin/kiosks', icon: Monitor },
      { label: 'Photographer Master', href: '/admin/photographers', icon: Camera },
      { label: 'Frames Master', href: '/admin/frames', icon: Frame },
      { label: 'Role Master', href: '/admin/roles', icon: Users },
      { label: 'Object Master', href: '/admin/objects', icon: Box },
      { label: 'Ultra Object Master', href: '/admin/ultra-objects', icon: Layers },
    ],
  },
  {
    label: 'Reports', icon: FileText, items: [
      { label: 'PG Report', href: '/admin/reports/photographer', icon: Camera },
      { label: 'Kiosk Report', href: '/admin/reports/kiosk', icon: Monitor },
      { label: 'Sales Report', href: '/admin/reports/sales', icon: Tag },
      { label: 'Staff Report', href: '/admin/reports/staff', icon: Users },
    ],
  },
  { label: 'Privacy Policy', href: '/admin/privacy-policy', icon: FileText },
];

function NavGroup({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isAnyChildActive = item.items?.some((c) => pathname.startsWith(c.href ?? '___'));
  const [open, setOpen] = useState(isAnyChildActive ?? false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--color-text-nav] hover:bg-[--color-surface-muted] rounded-lg transition-colors"
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-[--color-border-subtle] space-y-0.5">
          {item.items?.map((child) => <NavLeaf key={child.label} item={child} />)}
        </div>
      )}
    </div>
  );
}

function NavLeaf({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = item.href
    ? item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href)
    : false;

  return (
    <Link
      href={item.href ?? '#'}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors relative',
        isActive
          ? 'bg-[--color-gold-tint] text-[--color-gold-tint-text] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[--color-gold] rounded-none'
          : 'text-[--color-text-nav] hover:bg-[--color-surface-muted]',
      )}
    >
      <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-[--color-gold]')} />
      <span>{item.label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[--color-border-subtle] bg-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[--color-border-subtle]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[--color-gold] rounded-lg flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[--color-text-primary] leading-tight">FACE CRAFT STUDIO</p>
              <p className="text-[10px] text-[--color-text-secondary] leading-tight truncate">WHERE TECHNOLOGY MEETS TRADITION</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navigation.map((item) =>
            item.items ? <NavGroup key={item.label} item={item} /> : <NavLeaf key={item.label} item={item} />
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-[--color-border-subtle] pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--color-text-nav] hover:bg-[--color-surface-muted] rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-[--color-border-subtle] bg-white flex items-center justify-end px-6 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 hover:bg-[--color-surface-muted] rounded-lg px-3 py-1.5 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">TM</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-[--color-text-primary] leading-tight">Thiviya</p>
                <p className="text-xs text-[--color-text-secondary] leading-tight">Manager</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[--color-text-secondary]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-[--color-danger-text]">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
