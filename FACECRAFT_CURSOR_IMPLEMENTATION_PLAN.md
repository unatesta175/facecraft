# FaceCraft - Cursor Implementation Plan

## 1. Objective

Build a production-oriented first release of FaceCraft and deploy it on one AWS EC2 instance.

This release uses:

- Next.js with TypeScript for the customer kiosk and management portal
- Node.js with Express and TypeScript for the REST API
- Prisma ORM with MySQL
- AWS S3 for private photograph storage
- AWS Rekognition for face indexing and photo matching
- Nginx as the reverse proxy on EC2
- PM2 or systemd to keep the Next.js and Express processes running

This release does not use:

- GitLab CI/CD
- Application Load Balancer
- Docker
- Terraform
- Amazon RDS
- Redis or a distributed job queue

The architecture must keep clear boundaries so those services can be added later without rewriting the application.

## 2. Instructions for Cursor

Use this document as the source of truth. Work through one phase at a time.

For every phase:

1. Inspect the repository before changing code.
2. Reuse existing conventions and working components.
3. List the files that will be changed.
4. Implement the phase completely instead of generating placeholders.
5. Run linting, type checking, relevant tests, and the production build.
6. Fix all failures before moving to the next phase.
7. Update the checklist in this document.
8. Do not remove unrelated user changes.

Do not claim an external integration works unless it has been tested with valid credentials or physical hardware. Development simulators must be clearly identified and disabled in production.

## 3. Target Architecture

```mermaid
flowchart TD
    K["Customer kiosk"] --> N["Nginx on EC2"]
    U["Admin or photographer"] --> N
    N --> W["Next.js process"]
    N --> A["Express API process"]
    W --> A
    A --> M["MySQL on EC2"]
    A --> S["Private S3 bucket"]
    A --> R["AWS Rekognition"]
```

### EC2 request routing

| Route | Destination |
|---|---|
| `/` | Next.js on `127.0.0.1:3000` |
| `/api/` | Express on `127.0.0.1:4000` |
| `/api/health` | Express health check |

Only Nginx is publicly accessible. MySQL, Next.js, and Express bind to localhost.

## 4. Recommended Repository Structure

Use npm workspaces unless the existing repository already has a suitable monorepo tool.

```text
facecraft/
  apps/
    web/                 # Next.js application
    api/                 # Express application
  packages/
    contracts/           # Shared Zod schemas and TypeScript types
    config/              # Shared ESLint and TypeScript configuration
    ui/                  # Optional shared UI primitives
  infrastructure/
    nginx/
    systemd/             # Or PM2 ecosystem configuration
    scripts/
  docs/
  package.json
  .env.example
```

Do not share Prisma database entities directly with the browser. Use explicit API response schemas.

## 5. Core Technical Decisions

### Frontend

- Next.js App Router and strict TypeScript
- Tailwind CSS and shadcn/ui
- Framer Motion for purposeful animation
- Lucide icons
- TanStack Table for management tables
- React Hook Form and Zod for forms
- Next/Image for optimized image rendering
- Route-level error and loading boundaries

### Backend

- Express with TypeScript
- REST routes under `/api/v1`
- Prisma ORM and MySQL migrations
- Zod request validation
- Structured error responses
- Pino structured logging with sensitive-field redaction
- OpenAPI documentation
- Cookie-based management sessions or secure server sessions
- RBAC checks in API middleware

### Single-instance background work

Use a MySQL-backed `Job` table and a separate worker process. The worker polls for queued work and handles:

- thumbnail generation
- Rekognition face indexing
- image cleanup
- failed operation retries

Use atomic status transitions so a job is not processed twice. Do not introduce Redis in this release.

## 6. Environment Variables

Create validated environment configuration. The application must refuse to start in production when a required value is missing.

```dotenv
NODE_ENV=development
WEB_PORT=3000
API_PORT=4000
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
DATABASE_URL=mysql://facecraft:password@127.0.0.1:3306/facecraft
SESSION_SECRET=replace-with-at-least-32-random-bytes
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=facecraft-private-photos
REKOGNITION_COLLECTION_ID=facecraft-photos
PHOTO_RETENTION_DAYS=7
SIGNED_URL_TTL_SECONDS=300
KIOSK_SESSION_TTL_MINUTES=30
```

In EC2 production, use an IAM instance role. Do not store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in the repository or production `.env` file.

## 7. Database Implementation

### Required models

Create normalized Prisma models with UUIDs or CUIDs, timestamps, foreign keys, indexes, and suitable enums:

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `PhotographerProfile`
- `StaffProfile`
- `Kiosk`
- `KioskSession`
- `Event`
- `Photo`
- `PhotoVariant`
- `PhotoFace`
- `Frame`
- `ProductCategory`
- `Product`
- `ProductVariant`
- `Package`
- `PackageItem`
- `Cart`
- `CartItem`
- `CartItemPhoto`
- `Order`
- `OrderItem`
- `OrderItemPhoto`
- `OrderStatusHistory`
- `Payment`
- `PaymentAttempt`
- `Discount`
- `DiscountRedemption`
- `Receipt`
- `DigitalGallery`
- `PrintJob`
- `Job`
- `AuditLog`
- `AppSetting`

### Essential business constraints

- Every photo belongs to one photographer.
- Every order is associated with one photographer.
- Store prices as MySQL `DECIMAL`, never floating-point values.
- Store S3 object keys, not public S3 URLs.
- A package cannot enter the cart until every package item has the required number of assigned photographs.
- Recalculate price and discount on the API before creating an order.
- Payment attempts use unique idempotency keys.
- Photos and all derived variants have `expiresAt` values.
- Administrative deletes should use soft deletion where historical order integrity is required.

### Seed data

Create an idempotent Prisma seed containing:

- super administrator
- administrator
- photographer
- staff user
- roles and permissions
- registered kiosk
- sample event
- frames
- product categories
- at least eight realistic products
- at least three packages with different photo requirements
- valid and expired discount examples
- sample orders in different statuses

Never seed fake photographs into the production S3 bucket automatically.

## 8. API Modules

Implement each module with route, controller, service, repository access, validation, authorization, tests, and OpenAPI documentation.

### Public and kiosk APIs

- kiosk registration verification
- kiosk heartbeat
- create and expire kiosk session
- capture search request
- manual photo search with cursor pagination
- frames and catalogue retrieval
- cart creation and updates
- photo-to-product assignment
- discount validation
- order creation
- payment method selection
- receipt and digital gallery access

### Authentication and management APIs

- login and logout
- current user
- photographer registration
- users, roles, and permissions
- photographers
- events
- photo uploads and metadata
- products and product variants
- packages and package items
- orders and status history
- discounts
- kiosks
- print jobs
- reports
- settings
- audit logs

### API response format

Use a consistent envelope:

```json
{
  "data": {},
  "meta": {},
  "error": null,
  "requestId": "uuid"
}
```

Errors must include a stable error code, safe message, and field errors where applicable.

## 9. S3 Implementation

### Bucket design

Use one private bucket for this release with prefixes:

```text
originals/{photographerId}/{eventId}/{photoId}/original.ext
thumbnails/{photographerId}/{eventId}/{photoId}/small.webp
thumbnails/{photographerId}/{eventId}/{photoId}/medium.webp
variants/{photographerId}/{eventId}/{photoId}/{variantId}.webp
temporary/selfies/{kioskSessionId}/{captureId}.jpg
receipts/{orderId}/receipt.pdf
```

### Security rules

- Block all public access.
- Enable server-side encryption.
- Grant the EC2 IAM role access only to the required bucket actions.
- Use short-lived presigned upload and download URLs.
- Validate file extension, MIME type, signature, dimensions, and maximum size on the API.
- Never accept an arbitrary S3 key from the client without ownership validation.

### Seven-day retention

Implement both:

1. An S3 lifecycle rule that expires customer photo objects after seven days.
2. An application cleanup worker that marks expired database records and deletes related objects.

Temporary selfie captures should expire much sooner, preferably within one day, and should be deleted immediately after matching when possible.

## 10. Rekognition Implementation

### Photographer upload flow

1. Photographer creates or selects an event.
2. API issues a presigned S3 upload URL.
3. Browser uploads the original directly to S3.
4. Browser confirms upload to the API.
5. API creates a queued thumbnail and face-indexing job.
6. Worker creates thumbnails.
7. Worker calls Rekognition `IndexFaces` using the S3 object.
8. Store returned face IDs, photo ID, event ID, and photographer ID in MySQL.

Use a Rekognition collection naming strategy that can later support multiple studios. For the first release, use one configured collection and filter matches in the database by event, photographer, date, and expiry status.

### Customer selfie flow

1. Capture the selfie in the kiosk browser.
2. Compress it to an appropriate JPEG size before upload.
3. Upload it through a short-lived presigned URL.
4. API calls `SearchFacesByImage`.
5. Resolve returned face IDs to active photos in MySQL.
6. Return paginated matching photos ordered by confidence and capture time.
7. Delete the selfie after the search.

### Matching safety

- Keep the confidence threshold configurable.
- Do not present low-confidence results as confirmed identity matches.
- Provide manual search when no match is found.
- Log request IDs and result counts, but do not log biometric image data.
- Obtain clear consent before capturing the selfie.
- Prevent customers from searching expired or unauthorized event photos.

## 11. Frontend Routes

### Customer kiosk

| Route | Purpose |
|---|---|
| `/kiosk` | Welcome and selfie entry |
| `/kiosk/search` | Face results or manual search |
| `/kiosk/review` | Review and edit selected photos |
| `/kiosk/shop` | Products, packages, and album |
| `/kiosk/cart` | Cart and discount summary |
| `/kiosk/payment` | Payment method flow |
| `/kiosk/complete` | Receipt and session completion |
| `/gallery/[token]` | Expiring digital gallery |

### Management portal

| Route | Purpose |
|---|---|
| `/login` | Management authentication |
| `/dashboard` | Role-aware summary |
| `/photos` | Photo management and upload |
| `/events` | Event management |
| `/products` | Product management |
| `/packages` | Package composition |
| `/orders` | Order table |
| `/orders/[id]` | Order details and status |
| `/photographers` | Photographer management |
| `/staff` | Staff and access management |
| `/kiosks` | Kiosk registration and status |
| `/discounts` | Discount management |
| `/settings` | Theme and application settings |

## 12. Customer Workflow Implementation

### Home and selfie

- Show the FaceCraft studio welcome screen.
- Provide `Take a Selfie` and `Manual Search` actions.
- Open the webcam in an accessible modal.
- Support permission denial, capture, retry, cancel, and camera-unavailable states.
- Display consent before face search.

### Photo selection

- Filter by event, date, and time.
- Display a two-column kiosk grid.
- Use cursor-based infinite scrolling.
- Use a horizontally scrollable frame selector.
- Preserve selected photos while loading more pages.
- Display matching confidence only if it helps the customer and does not create confusion.

### Review and editing

- Previous and next photo navigation
- zoom, pan, crop, rotate, resize, reset, and apply
- non-destructive editing instructions stored as a photo variant
- print-safe-area preview
- client-side canvas previews
- Web Worker for expensive batch transforms where useful

Target a visual response within one to two seconds when applying frames, rotation, or resizing to up to 20 selected photographs. Save processed versions asynchronously.

### Shop and package rules

- Two-column kiosk layout: package catalogue and selected album.
- Show each product's required photograph count.
- Open an assignment modal when adding photographs to a product.
- Preview the photograph using the product's print aspect ratio.
- Disable add-to-cart until all requirements are fulfilled.
- Allow multiple completed packages in the cart.
- Only one incomplete package selection can be active at a time.
- Ask before clearing an incomplete selection.

### Cart and payment

- Show package, products, images, quantities, subtotal, discount, and total.
- Revalidate the cart on the server.
- Present card, QR, and cash methods.
- For this release, build payment provider interfaces and a development simulator.
- Never simulate successful production payment.
- Mark payment providers unavailable in production until real GHL and QR specifications are configured.
- Cash requires authenticated staff verification.

### Completion

- Generate the receipt record and digital gallery token after confirmed payment.
- Print through a `PrintProvider` interface.
- Clear webcam tracks, local image URLs, cart state, and kiosk session data.
- Return to the kiosk home page after a configurable timeout.

## 13. Management Workflows

### Photographer

- register and log in
- manage profile
- create events
- bulk upload photographs directly to S3
- monitor upload, thumbnail, and face-index status
- view only owned photographs and associated orders

### Administrator

- dashboard statistics and recent orders
- searchable TanStack tables
- create, edit, archive, and view products
- create packages and configure photo requirements
- view order details and status history
- update order status using valid transitions
- manage photographers, staff, kiosks, frames, and discounts
- inspect failed jobs and audit logs

## 14. Loading, Motion, and Performance


### Framer Motion

Use Framer Motion for:

- page and modal transitions
- staggered photo grid entry
- selection feedback
- shared photo preview transitions
- cart quantity and price changes
- upload and processing progress

Respect `prefers-reduced-motion`. Prefer opacity and transform animations.

### Lazy loading

Dynamically import:

- webcam capture
- photo cropper/editor
- charts
- print integration
- heavy management modals

Load thumbnails in grids and full-resolution images only in the editor. Use explicit image dimensions, responsive sizes, and blur placeholders. Revoke object URLs and stop media streams during cleanup.


## 16. Testing Plan

### Unit tests

- price calculation
- package photo requirements
- discount validation
- order status transitions
- retention dates
- S3 key ownership validation
- Rekognition result mapping
- RBAC permissions

### API integration tests

- authentication
- kiosk sessions
- presigned upload confirmation
- photo search authorization
- cart and order creation
- duplicate payment attempts
- expired gallery access

### Playwright tests

- manual kiosk journey from home to cart
- selfie permission denied fallback
- photographer photo upload
- admin product and package creation
- admin order processing
- unauthorized route access

Mock AWS only in automated tests. Add one separate credentials-required smoke script for real S3 and Rekognition validation.

## 17. EC2 Provisioning Plan

### Recommended starting instance

Use Ubuntu LTS on at least `t3.large` for the combined application and MySQL workload. Monitor CPU, memory, storage, and database latency before changing size. Use an encrypted gp3 EBS volume with enough space for MySQL, logs, builds, and temporary image processing.

### Security group

| Port | Source | Purpose |
|---|---|---|
| `22` | Administrator IP only | SSH |
| `80` | Required client networks | HTTP and certificate setup |
| `443` | Required client networks | HTTPS application access |

Do not open ports `3000`, `4000`, or `3306`.

### IAM instance role

Grant only:

- required S3 object actions for the FaceCraft bucket
- required S3 multipart-upload actions
- Rekognition collection, indexing, search, and deletion actions
- CloudWatch log permissions if CloudWatch is configured

Scope resource ARNs as narrowly as AWS supports.

### Installation order
 
1. Allocate and associate an Elastic IP.
2. Configure DNS to point to the Elastic IP.
3. Install Node.js LTS, npm, MySQL, Nginx, Git, build tools, and PM2 or systemd units.
4. Run `mysql_secure_installation`.
5. Create a dedicated MySQL database and least-privilege user.
6. Clone or transfer the repository to `/var/www/facecraft`.
7. Create the production environment file with restrictive permissions.
8. Install dependencies using the lockfile.
9. Run Prisma migrations and the approved seed.
10. Build the API and Next.js applications.
11. Start the API, web, and worker processes.
12. Configure Nginx reverse proxy and upload limits.
13. Configure HTTPS using Certbot when a domain is available.
14. Configure firewall, log rotation, backups, and monitoring.
15. Verify reboot recovery.

### Required processes

| Process | Binding | Purpose |
|---|---|---|
| `facecraft-web` | `127.0.0.1:3000` | Next.js |
| `facecraft-api` | `127.0.0.1:4000` | Express API |
| `facecraft-worker` | none | MySQL job worker |
| `mysql` | `127.0.0.1:3306` | Database |
| `nginx` | `80/443` | Public reverse proxy |

### Manual deployment script

Create `infrastructure/scripts/deploy.sh` that safely performs:

1. repository update or release extraction
2. dependency installation from the lockfile
3. Prisma client generation
4. production migration
5. API and web builds
6. process restart
7. health verification
8. automatic failure exit with clear logs

Do not run destructive database reset or development migrations in production.

## 18. Backup and Recovery

Because MySQL shares the EC2 instance, backup is mandatory.

- Run a daily `mysqldump` using a restricted backup user.
- Compress and upload the dump to a separate encrypted S3 backup prefix or bucket.
- Apply an appropriate retention policy to database backups.
- Do not use the seven-day photo lifecycle rule for database backups.
- Test database restoration before launch.
- Create EBS snapshots as secondary protection.
- Document application, database, and S3 recovery steps.

## 19. Health and Monitoring

Implement:

- `GET /api/health` for process health
- `GET /api/ready` for MySQL and required configuration readiness
- structured API and worker logs
- disk-space monitoring
- MySQL backup success logs
- failed job visibility in the admin portal
- alerts for repeated Rekognition failures, S3 failures, low disk space, high memory, and process restart loops

## 20. Implementation Phases

### Phase 0 - Repository audit

- [ ] Inspect existing code and dependencies.
- [ ] Record reusable and incomplete features.
- [ ] Confirm local development commands.
- [ ] Create the workspace structure without deleting working code.

Exit criteria: the repository builds or all pre-existing failures are documented.

### Phase 1 - Foundation

- [ ] Configure strict TypeScript, linting, formatting, and workspaces.
- [ ] Add shared contracts and environment validation.
- [ ] Configure global theme tokens and shadcn/ui.
- [ ] Add API error handling, logging, health endpoints, and OpenAPI.

Exit criteria: web and API run locally and pass lint/type-check.

### Phase 2 - Database and access control

- [ ] Implement Prisma schema and migrations.
- [ ] Create realistic, idempotent seed data.
- [ ] Implement authentication, sessions, RBAC, and audit logging.
- [ ] Implement kiosk registration and kiosk sessions.

Exit criteria: role and kiosk authorization tests pass.

### Phase 3 - AWS photo pipeline

- [ ] Implement private S3 uploads and downloads.
- [ ] Implement thumbnail jobs and photo metadata.
- [ ] Create the Rekognition collection setup script.
- [ ] Implement face indexing and search.
- [ ] Implement seven-day cleanup and lifecycle documentation.

Exit criteria: a real AWS smoke test can upload, index, search, retrieve, and delete a test photograph.

### Phase 4 - Photographer portal

- [ ] Implement photographer dashboard and event management.
- [ ] Implement bulk uploads with progress and retry.
- [ ] Show processing and face-index statuses.
- [ ] Enforce photographer ownership.

Exit criteria: a photographer can upload event photos and cannot view another photographer's assets.

### Phase 5 - Customer discovery and editing

- [ ] Implement kiosk home and webcam modal.
- [ ] Implement Rekognition search and manual fallback.
- [ ] Implement filters, infinite photo grid, selection, and frame selector.
- [ ] Implement review, rotation, resize, crop, zoom, and non-destructive variants.
- [ ] Meet the one-to-two-second preview performance target.

Exit criteria: the customer can find, select, edit, and retain selections across the workflow.

### Phase 6 - Catalogue, packages, and cart

- [ ] Implement products, variants, packages, and frames.
- [ ] Implement photo requirement rules and assignment preview.
- [ ] Implement cart, quantity, discount, and server-side price validation.
- [ ] Add admin catalogue pages with TanStack Table.

Exit criteria: incomplete packages cannot be purchased and totals cannot be altered by the browser.

### Phase 7 - Orders, payment boundary, and receipts

- [ ] Implement order creation and status history.
- [ ] Add payment and print provider interfaces.
- [ ] Add clearly labelled development simulators.
- [ ] Implement staff verification for cash.
- [ ] Implement receipt and expiring gallery records.

Exit criteria: orders and receipts work in development; unavailable production payment providers cannot report false success.

### Phase 8 - Admin operations

- [ ] Implement dashboard and management tables.
- [ ] Implement product, package, photographer, kiosk, discount, and order pages.
- [ ] Implement order detail, valid status transitions, print job visibility, and audit log.

Exit criteria: administrators can operate the full order lifecycle according to RBAC.

### Phase 9 - UX and performance completion

- [ ] Add route and component skeletons.
- [ ] Add lazy loading and dynamic imports.
- [ ] Add Framer Motion transitions with reduced-motion support.
- [ ] Optimize thumbnails, caching, queries, and large lists.
- [ ] Verify kiosk, desktop, tablet, and mobile layouts.

Exit criteria: no blank loading screens, major layout shifts, stretched photos, or blocking full-resolution grids remain.

### Phase 10 - EC2 deployment

- [ ] Provision EC2, Elastic IP, IAM role, security group, S3, and Rekognition collection.
- [ ] Install and secure MySQL.
- [ ] Configure Nginx and HTTPS.
- [ ] Deploy web, API, and worker processes.
- [ ] Configure backup, restart, logging, and health checks.
- [ ] Run production smoke tests from a kiosk and remote admin device.

Exit criteria: the application survives an EC2 reboot and all critical smoke tests pass over HTTPS.

## 21. Final Acceptance Checklist

- [ ] Customer access requires a registered kiosk session.
- [ ] Admin and photographer permissions are enforced by the API.
- [ ] Every order and photo is associated with a photographer.
- [ ] S3 objects are private and accessed through short-lived signed URLs.
- [ ] Rekognition indexing and selfie search work with real AWS credentials through the EC2 role.
- [ ] Temporary selfies are removed after processing.
- [ ] Customer photos and variants expire after seven days.
- [ ] Package photo requirements are enforced server-side.
- [ ] Full-resolution photos are not loaded in gallery grids.
- [ ] Skeleton, error, empty, retry, and offline states exist.
- [ ] Framer Motion respects reduced-motion preferences.
- [ ] Next.js, Express, and MySQL are not directly exposed to the internet.
- [ ] HTTPS is active.
- [ ] MySQL backups and restoration have been tested.
- [ ] Lint, type-check, tests, and production builds pass.
- [ ] No production secrets exist in Git.
- [ ] No simulated payment can be enabled accidentally in production.
- [ ] Deployment and rollback steps are documented and tested.

## 22. Deferred Until Specifications or Hardware Are Available

Keep interfaces and database records ready, but do not claim these integrations are complete yet:

- GHL card device
- production QR payment provider
- HotFolderDNP printer watcher
- physical receipt printer
- Gemini or another AI image-editing provider

Each deferred provider must implement a stable interface so it can replace the development adapter without changing the cart, order, or customer workflow.
