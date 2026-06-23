# Admin Dashboard Component Usage Guide

## Quick Start Template

### Basic Admin Page Structure
```typescript
'use client';

import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Download } from 'lucide-react';

export default function YourPage() {
  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[--color-text-primary]">
              Your Page Title
            </h1>
            <p className="text-sm text-[--color-text-secondary] mt-1">
              Brief description of this page
            </p>
          </div>
          <Button className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>

        {/* Your content here */}
      </div>
    </AdminLayout>
  );
}
```

## Component Patterns

### 1. Table with Toolbar
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
  {/* Toolbar */}
  <div className="p-4 border-b border-[--color-border] flex items-center gap-3">
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--color-text-secondary]" />
      <Input
        placeholder="Search..."
        className="pl-10"
      />
    </div>
    <Button variant="outline" className="text-[--color-chocolate]">
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
    <Button variant="outline" className="text-[--color-chocolate]">
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  </div>

  {/* Table */}
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>#</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="w-20">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item, index) => (
        <TableRow key={item.id}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>{item.name}</TableCell>
          <TableCell>
            <Badge variant="success">Active</Badge>
          </TableCell>
          <TableCell>
            {/* Actions dropdown - see below */}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  {/* Pagination - see below */}
</div>
```

### 2. Actions Dropdown Menu
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleView(item.id)}>
      <Eye className="h-4 w-4 mr-2" />
      View
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleEdit(item.id)}>
      <Pencil className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      onClick={() => handleDelete(item.id)}
      className="text-[--color-danger-text]"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 3. Pagination
```typescript
<div className="p-4 border-t border-[--color-border] flex items-center justify-between">
  <p className="text-sm text-[--color-text-secondary]">
    Showing {start} to {end} of {total} entries
  </p>
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setPage(p => p - 1)}
      disabled={currentPage === 1}
    >
      Previous
    </Button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
      <Button
        key={page}
        variant={page === currentPage ? 'default' : 'outline'}
        size="sm"
        onClick={() => setPage(page)}
        className={
          page === currentPage
            ? 'bg-[--color-gold] hover:bg-[--color-gold]/90 text-white'
            : ''
        }
      >
        {page}
      </Button>
    ))}
    <Button
      variant="outline"
      size="sm"
      onClick={() => setPage(p => p + 1)}
      disabled={currentPage === totalPages}
    >
      Next
    </Button>
  </div>
</div>
```

### 4. Delete Confirmation Dialog
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

<Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this item? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setDeleteDialog({ open: false, id: null })}
      >
        Cancel
      </Button>
      <Button
        onClick={confirmDelete}
        className="bg-[--color-danger-text] hover:bg-[--color-danger-text]/90 text-white"
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. Create/Edit Form Dialog
```typescript
const [createDialog, setCreateDialog] = useState(false);

<Dialog open={createDialog} onOpenChange={setCreateDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create New Item</DialogTitle>
      <DialogDescription>
        Fill in the details below to create a new item.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[--color-text-primary]">
          Name
        </label>
        <Input placeholder="Enter name..." />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-[--color-text-primary]">
          Description
        </label>
        <Input placeholder="Enter description..." />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setCreateDialog(false)}>
        Cancel
      </Button>
      <Button 
        onClick={handleCreate}
        className="bg-[--color-gold] hover:bg-[--color-gold]/90 text-white"
      >
        Create
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6. Status Badges
```typescript
import { Badge } from '@/components/ui/badge';

// Active status
<Badge variant="success">Active</Badge>

// Default badge
<Badge>Pending</Badge>

// Custom colors
<Badge className="bg-[--color-gold-tint] text-[--color-gold-tint-text]">
  Featured
</Badge>
```

### 7. Product/Item Thumbnails
```typescript
import { Package } from 'lucide-react';

// Alternating gold/chocolate tint
<div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
  index % 2 === 0 ? 'bg-[--color-gold-tint]' : 'bg-[--color-chocolate-tint]'
}`}>
  <Package className={`h-5 w-5 ${
    index % 2 === 0 ? 'text-[--color-gold]' : 'text-[--color-chocolate]'
  }`} />
</div>
```

### 8. Toast Notifications
```typescript
import { toast } from '@/hooks/use-toast';

// Success
toast({
  title: "Success",
  description: "Item created successfully",
});

// Error
toast({
  title: "Error",
  description: "Failed to create item",
  variant: "destructive",
});

// With action
toast({
  title: "Item deleted",
  description: "The item has been removed from your list",
  action: (
    <Button variant="outline" size="sm" onClick={handleUndo}>
      Undo
    </Button>
  ),
});
```

### 9. Stat Cards (Dashboard)
```typescript
import { Package } from 'lucide-react';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="bg-white border border-[--color-border] rounded-xl p-6 space-y-3">
    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[--color-gold-tint]">
      <Package className="h-6 w-6 text-[--color-gold]" />
    </div>
    <div>
      <p className="text-sm text-[--color-text-secondary]">Total Products</p>
      <p className="text-3xl font-semibold text-[--color-text-primary] mt-1">
        124
      </p>
    </div>
  </div>
</div>
```

## Color Reference

### CSS Variables
```css
/* Backgrounds */
--color-bg: #ffffff
--color-surface-muted: #f7f6f3

/* Borders */
--color-border: #e8e3d8
--color-border-subtle: #ececec

/* Text */
--color-text-primary: #1f1b16
--color-text-secondary: #9a9286
--color-text-nav: #4b463d

/* Gold (Primary) */
--color-gold: #c9982f
--color-gold-tint: #fbf3df
--color-gold-tint-text: #8a6a1f

/* Chocolate (Secondary) */
--color-chocolate: #5c3a21
--color-chocolate-tint: #f3eee5

/* Status */
--color-success-bg: #eef3e3
--color-success-text: #436b35
--color-danger-text: #a32d2d
```

### When to Use Each Color

**Gold** (`--color-gold`):
- Primary CTA buttons (Create, Save, Submit)
- Active sidebar navigation item
- Pagination current page
- Focus states

**Chocolate** (`--color-chocolate`):
- Secondary action buttons (Refresh, Export)
- Ghost button text
- User avatar background

**Surface Muted** (`--color-surface-muted`):
- Table header backgrounds
- Input field backgrounds
- Hover states (use with opacity: `/50`)

**Text Colors**:
- `--color-text-primary`: Headings, primary content
- `--color-text-secondary`: Descriptions, subtitles, placeholders
- `--color-text-nav`: Sidebar navigation items

## Common Patterns

### Search Implementation
```typescript
const [searchQuery, setSearchQuery] = useState('');

const filteredItems = items.filter(item =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);

<Input
  placeholder="Search Name"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

### Pagination Logic
```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
const paginatedItems = filteredItems.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);
```

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(false);

if (isLoading) {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[--color-gold] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[--color-text-secondary]">Loading...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
```

## Best Practices

1. **Always wrap pages in `<AdminLayout>`** for consistent navigation and header
2. **Use 8px-based spacing** (`space-y-6`, `gap-6`, `p-8`, etc.)
3. **Keep borders subtle** (0.5px where possible, use `border-[--color-border-subtle]`)
4. **Icon-only for actions** - use dropdown menus, not separate buttons
5. **Confirm destructive actions** - always show a dialog for delete
6. **Show feedback** - use toast notifications for all CRUD operations
7. **Use proper status badges** - soft pill shapes with `variant="success"`
8. **Maintain white backgrounds** - avoid colored page backgrounds
9. **Gold for primary actions only** - don't overuse the accent color
10. **Generous whitespace** - let the UI breathe

---

**Pro Tip**: Copy the Combo Products page (`apps/web/src/app/admin/products/combo/page.tsx`) as a starting point for new pages. It includes all the patterns and best practices already implemented.
