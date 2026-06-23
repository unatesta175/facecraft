# FaceCraft Admin Dashboard — Build Spec for Cursor

Scope: **admin/staff dashboard only** (Next.js + TS + Tailwind + shadcn/ui + Prisma + MySQL + Express API). Customer-facing kiosk flow is out of scope here — build the back-office app shown in the screenshots: Dashboard, Order Management, Products, Masters, Reports.

Build all pages below, wire them to the Prisma models below, seed realistic demo data so every list/report page is populated and paginated, and make sure all relations actually join correctly (no orphan FKs).

---

## 1. Database — Prisma models

```
User            id, staffCode(unique e.g. "Fc105"), name, username(unique), passwordHash,
                email, phone, locationArea, role(enum: ADMIN/MANAGER/SUPERVISOR/
                ACCOUNT_MANAGER/STAFF), deletePermission(bool, default false),
                profileImageUrl?, status(enum: ACTIVE/INACTIVE), createdAt
                → orders[] (as staff), orderPhotos[] (as photographer)

Kiosk           id, name, username(unique), passwordHash, description?, profileImageUrl?,
                status(enum), createdAt → orders[]

Size            id, height(decimal), width(decimal), createdAt → products[]

Product         id, name, price(decimal), description?, productType(enum: EMAIL/MAGNET/
                OTHERS/CERTIFICATE_LEFT_1/CERTIFICATE_LEFT_2/CERTIFICATE_RIGHT_1 — extend
                freely), photoLimit(int), sizeId(FK Size?), imageUrl?, status(enum), createdAt
                → comboItems[], orderPhotos[]

ComboProduct    id, name, price(decimal), description?, thumbnailUrl?, status(enum), createdAt
                → items[] (ComboProductItem), orderCombos[]

ComboProductItem id, comboProductId(FK), productId(FK), quantity(int, default 1)
                — join table, many-to-many ComboProduct↔Product

Discount        id, code(unique), amount(decimal), description?, createdAt → orders[]

Frame           id, name, imageUrl, status(enum), createdAt → orderPhotos[]

ObjectMaster    id, title, description?, imageUrl?, status(enum), createdAt → ultraItems[]

UltraObject     id, title, description?, imageUrl?, status(enum), createdAt → items[]

UltraObjectItem id, ultraObjectId(FK), objectId(FK)
                — join table, many-to-many UltraObject↔ObjectMaster

Order           id, orderCode(unique e.g. "ORD-0622071044182"), kioskId(FK), staffId(FK→User),
                discountId(FK→Discount?), date, time, paymentType(enum: CASH/CARD/QR),
                price(decimal), paymentStatus(enum: PENDING/COMPLETED/CANCELLED), createdAt
                → orderCombos[]

OrderCombo      id, orderId(FK), comboProductId(FK), comboCode(e.g. "#1782112233117"),
                priceSnapshot(decimal), descriptionSnapshot?, createdAt → orderPhotos[]

OrderPhoto      id, orderComboId(FK), productId(FK→Product?), photographerId(FK→User?),
                frameId(FK→Frame?), folderLabel(e.g. "Photo Folder X 2"), imageUrl(S3 key),
                expiresAt(createdAt + 7 days), createdAt
```

Notes:
- "Photographer Master" page = `User` list filtered to `role = STAFF`. "Role Master" page = full `User` list across all roles. Same table, two filtered views — don't duplicate the model.
- `ProductType` and badge `status` values should be real Prisma enums, not free strings.
- S3 + AWS Rekognition integration can be stubbed for now — just persist `imageUrl` as a string field.

### Seed data (minimum, for populated/paginated UI)
5 users (1 ADMIN, 1 MANAGER, 3 STAFF with staffCodes like Fc101–Fc112), 5 kiosks, 3 sizes, ~31 products across types, ~28 combo products each linked to 3–5 products, 5 discounts, 14 frames, 10 objects, 2 ultra objects (each linking 2–3 objects), 40+ orders spread across kiosks/staff/payment types/statuses, each with 1 order-combo and a handful of order-photos — mirror the quantities visible in the screenshots ("Showing X of Y entries").

---

## 2. Pages

### Dashboard
- **Home** (`/dashboard`) — Cards: Total Orders, Total Sales (RM), Total Photographers, Total Kiosks. Recent orders table: Order ID, Kiosk, Date, Price, Status(badge).

### Order Management
- **Order List** (`/orders`) — Filters: Kiosk(select), Date range(picker), Order ID(input). Buttons: Refresh, Search, Export. Table: #, Kiosk Name, Order ID, Staff ID, Date, Time, Payment Type, Price, Payment Status(badge), Actions(view).
- **Order Detail** (`/orders/[id]`) — Header: Order ID, Staff ID, Print Receipt(btn), Back(btn). Update Order Status(select: Pending/Completed/Cancelled). Combo card: Combo ID, Product Name, Date, Time, Price, Description, Thumbnail. Repeating photo-folder sections: folder label + size icon, Download(btn), Print(btn), image grid.

### Products
- **Product List** (`/products`) — Search(name)+Search btn, Refresh, Create. Table: #, Thumbnail, Name, Price, Status(badge), Actions(edit/delete/view).
- **Product Add/Edit** (`/products/new`, `/products/[id]/edit`) — Fields: Name*, Price*, Description, Product Type*(select), Status*(Active/InActive), Photo Limit*(number), Size*(select from Size Master), Product Image(drag-drop upload, "Change image" on edit). Buttons: Cancel, Create/Update.

### Combo Product
- **Combo List** (`/combos`) — Search(name)+Search, Refresh, Create. Table: #, Thumbnail, Name, Price, Status(badge), Actions(edit/delete/view).
- **Combo Add/Edit** (`/combos/new`, `/combos/[id]/edit`) — Fields: Combo Name*, Price*, Description, Status*, Thumbnail Image(upload). Add Products: multi-select picker showing product cards (thumbnail + name), each removable as a chip with × once added. Buttons: Cancel, Create/Update.

### Size Master
- **Size List** (`/sizes`) — Create btn. Table: #, Height, Width, Created, Actions(edit/delete/view).
- **Size Add/Edit** (`/sizes/new`, `/sizes/[id]/edit`) — Fields: Height*, Width*. Buttons: Cancel, Create/Update.

### Discount Master
- **Discount List** (`/discounts`) — Create btn. Table: #, Code, Amount, Created, Actions(edit/delete/view).
- **Discount Add/Edit** (`/discounts/new`, `/discounts/[id]/edit`) — Fields: Code*, Amount*, Description. Buttons: Cancel, Create/Update.

### Kiosk Master
- **Kiosk List** (`/kiosks`) — Search(name/username)+Search, Refresh, Create. Table: #, Kiosk Name, Username, Description, Created At, Status(badge), Actions(edit/delete/view).
- **Kiosk Add/Edit** (`/kiosks/new`, `/kiosks/[id]/edit`) — Fields: Name*, Description, Username*, Password*, Confirm Password*, Status*, Profile Upload (+ "Change image" on edit). Buttons: Cancel, Create/Update.

### Photographer Master (User list filtered role=STAFF)
- **Photographer List** (`/photographers`) — Search+Search, Refresh, Create. Table: #, Name, Username, Phone, Email, Location Area, Status(badge), Actions(edit/delete/view).
- **Photographer Add/Edit** (`/photographers/new`, `/photographers/[id]/edit`) — Fields: Name*, Phone Number*, Email ID*, Location Area*, Username*, Password*, Confirm Password*, Status*, Delete Permission*(Yes/No), Profile Upload. Buttons: Cancel, Create/Update.

### Frames Master
- **Frame List** (`/frames`) — Search(frame name)+Search, Refresh, Create. Table: #, Frame Name, Status(badge), Actions(edit/delete/view).
- **Frame Add/Edit** (`/frames/new`, `/frames/[id]/edit`) — Fields: Frame Name*, Status*, image upload (drag-drop / "Change image" on edit). Buttons: Cancel, Create/Update.

### Role Master (full User list, all roles)
- **Role List** (`/roles`) — Search+Search, Refresh, Create. Table: #, Name, User Type, Username, ID(staffCode), Phone, Email, Location Area, Status(badge), Actions(edit/delete/view).
- **Role Add/Edit** (`/roles/new`, `/roles/[id]/edit`) — Fields: Name*, Phone Number*, Email ID*, Location Area*, User Type*(select: Admin/Manager/Supervisor/Account Manager/Staff), User ID*, Username*, Password*, Confirm Password*, Status*, Profile Upload. Buttons: Cancel, Create/Update.

### Object Master
- **Object List** (`/objects`) — Search(title/desc)+Search, Refresh, Create. Table: #, Image, Title, Description, Status(badge), Created At, Actions(edit/delete/view).
- **Object Add/Edit** (`/objects/new`, `/objects/[id]/edit`) — Fields: Title*, Status*, Description(optional), Object Image(optional upload). Buttons: Cancel, Create/Update.

### Ultra Object Master
- **Ultra Object List** (`/ultra-objects`) — Search+Search, Refresh, Create. Table: #, Image, Title, Description, Status(badge), Created At, Actions(edit/delete/view).
- **Ultra Object Add/Edit/View** (`/ultra-objects/new`, `/ultra-objects/[id]`) — Fields: Title*, Status*, Description, Ultra Object Image(optional upload). Object Masters: multi-select chips linking existing ObjectMaster rows (shown as tags). Buttons: Cancel, Create/Update.

### Reports
All four share the same layout: 3–4 stat cards, a filter bar, Refresh + Search + Export buttons, and a paginated results table.
- **PG Report** (`/reports/photographer`) — Cards: Total Sales, Total Transactions, Total Amount, Total Uploads. Filters: Photographer(select), Order Status(select), Payment Type(select), Date range. Table: #, Name, Date, Time, Payment Type, Price, Payment Status(badge).
- **Kiosk Report** (`/reports/kiosk`) — Cards: Total Orders, Total Transactions, Total Amount. Filters: Kiosk(select), Order Status, Payment Type, Date range. Table: #, Kiosk Name, Date, Time, Payment Type, Price, Payment Status(badge).
- **Sales Report** (`/reports/sales`) — Cards: Total Sales, Total Transactions, Total Amount. Filters: Order ID(input), Order Status, Payment Type, Date range. Table: #, Order ID, Date, Time, Payment Type, Price, Payment Status(badge).
- **Staff Report** (`/reports/staff`) — Cards: Total Sales, Total Transactions, Total Amount. Filters: Search(Order ID/Staff ID), Staff(select), Order Status, Payment Type, Date range. Table: #, Order ID, Staff ID, Staff Name, Date, Time, Payment Type, Price, Payment Status(badge).

### Other
- **Login** (`/login`) — Username, Password, Login button. Role-based redirect after auth.
- **Privacy Policy** (`/privacy-policy`) — Static content page.
- **Shared topbar** — Avatar (initials), name, role label, dropdown → Logout.
- **Shared sidebar** — Dashboard, Order Management, Products (Product, Combo Product, Size Master, Discount Master), Masters (Kiosk Master, Photographer Master, Frames Master, Role Master, Object Master, Ultra Object Master), Reports (PG, Kiosk, Sales, Staff), Privacy Policy, Logout.

---

## 3. RBAC
Gate sidebar items + page-level access by `User.role`. Suggested defaults: ADMIN sees everything; MANAGER/SUPERVISOR see everything except Role Master; ACCOUNT_MANAGER sees Reports + Order Management only; STAFF (photographer) has no dashboard access by default unless `deletePermission`-style flags are extended — confirm exact matrix before locking permissions, the PDF only specifies "different sets of actions" without a full matrix.
