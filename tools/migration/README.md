# FaceCraft Data Migration

Import data from the old FaceCraft admin API into the new app database.

## Folder structure

```text
tools/migration/
  raw/              ← Python scraper JSON (your source data)
  normalized/       ← transformed JSON (generated)
  transform_all.py  ← step 1: raw → normalized
  README.md
apps/api/prisma/
  import-migration.ts  ← step 2: normalized → MySQL
```

## Step 1: Put raw JSON in `raw/`

```text
raw/products.json
raw/combos.json
raw/frames.json
raw/object_masters.json
raw/ultra_object_masters.json
raw/roles.json
raw/photographers.json
raw/kiosks.json
```

## Step 2: Transform

From repo root:

```powershell
python tools/migration/transform_all.py
```

This writes files to `normalized/` and a `validation_report.json`.

## Step 3: Seed the database

Make sure MySQL is running and `apps/api/.env` has a valid `DATABASE_URL`.

`npm run db:seed` runs the transform step automatically, then loads every normalized JSON file into MySQL.

```powershell
cd C:\Users\User\facecraft
npm run db:generate
npx prisma db push --schema=apps/api/prisma/schema.prisma
npm run db:seed
```

Full reset (drop DB, migrate, seed):

```powershell
npm run db:reset --workspace=apps/api
```

On EC2:

```bash
cd /var/www/facecraft
npm run db:generate
npx prisma db push --schema=apps/api/prisma/schema.prisma
npm run db:seed
```

To re-import without re-running the Python transform (when `normalized/` already exists):

```powershell
npm run db:import-migration
```

## What gets imported

| Raw file | Normalized output | DB table |
|---|---|---|
| `products.json` | `sizes.json`, `products.json` | `sizes`, `products` |
| `combos.json` | `combo_products.json` | `combo_products` |
| `frames.json` | `frames.json` | `frames` |
| `object_masters.json` | `object_masters.json` | `object_masters` |
| `ultra_object_masters.json` | `ultra_objects.json`, `ultra_object_items.json` | `ultra_objects`, `ultra_object_items` |
| `roles.json` + `photographers.json` | `users.json` | `users` |
| `kiosks.json` | `kiosks.json` | `kiosks` |

## Notes

- User passwords from the old system are preserved (hashed on import).
- Duplicate emails are rewritten to `{username}@facecraft.migrated`.
- `combo_product_items` are not in the scraped data — combos import without line items for now.
- `normalized/users.json` contains plaintext passwords — do not commit to public GitHub.
- Re-running import is safe (uses upsert).

## Verify

```powershell
npm run db:studio --workspace=apps/api
```

Check record counts match `normalized/validation_report.json`.
