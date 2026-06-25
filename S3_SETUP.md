# AWS S3 Setup for FaceCraft

FaceCraft stores all images in a **private S3 bucket**. Nothing is saved to a local `uploads/` folder on the server.

## What you need to do (one-time AWS setup)

### Step 1: Create the S3 bucket

1. Open [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. **Create bucket**
   - Name: `facecraft-private-photos` (or any globally unique name)
   - Region: `ap-southeast-1` (Singapore)
3. **Block all public access** — keep all 4 options checked
4. **Encryption**: enable SSE-S3 (Amazon S3 managed keys)
5. Create the bucket

Detailed screenshots: see [AWS_MANUAL_SETUP_GUIDE.md](./AWS_MANUAL_SETUP_GUIDE.md)

### Step 2b: Add S3 CORS (required for browser uploads)

Photographer uploads go **directly from the browser to S3**. Without CORS, you will see **"Failed to fetch"** even when AWS credentials are correct.

1. Open your bucket in the S3 Console
2. Go to **Permissions** → **Cross-origin resource sharing (CORS)**
3. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:4000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. Save. Retry the upload — no server restart needed.

For production, add your domain (e.g. `https://yourdomain.com`) to `AllowedOrigins`.

### Step 3: Create IAM credentials (local dev only)

On EC2 production, use an IAM instance role instead of access keys.

1. Open [IAM Console](https://console.aws.amazon.com/iam/)
2. Create a user (e.g. `facecraft-dev`) with programmatic access
3. Attach a policy with these permissions on your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::facecraft-private-photos",
        "arn:aws:s3:::facecraft-private-photos/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:CreateCollection",
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:ListCollections",
        "rekognition:DescribeCollection"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Save the **Access Key ID** and **Secret Access Key**

### Step 3: Configure `apps/api/.env`

Copy from the repo root `.env.example` or create `apps/api/.env`:

```env
NODE_ENV=development
API_PORT=4000
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

DATABASE_URL=mysql://facecraft:password@127.0.0.1:3306/facecraft
SESSION_SECRET=replace-with-at-least-32-random-bytes-here

AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=facecraft-private-photos
REKOGNITION_COLLECTION_ID=facecraft-photos

PHOTO_RETENTION_DAYS=7
SIGNED_URL_TTL_SECONDS=300

AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

Also create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 4: Run database migration

```powershell
cd C:\Users\User\facecraft
npm run db:migrate
```

This creates the `photographer_photos` table used for S3 uploads.

### Step 5: Restart the dev server

```powershell
npm run dev
```

---

## How uploads work now

| Feature | Flow |
|---------|------|
| **Photographer studio** (`/photographer`) | Login → select photos → API returns presigned URL → browser uploads directly to S3 → confirm |
| **Admin catalog images** | Use `POST /api/v1/assets/upload-url` then PUT to S3 (wired via `assetsApi.uploadCatalogImage`) |
| **Viewing images** | API converts S3 keys to short-lived presigned download URLs automatically |

### S3 key layout

```text
catalog/products/{uuid}.jpg       ← product / frame / object images
catalog/frames/...
catalog/objects/...
originals/{photographerId}/{photoId}/original.jpg   ← photographer uploads
temporary/selfies/...             ← kiosk selfies (future)
```

---

## Upload migrated catalog images (optional)

If you have image files from your old system:

1. Put files in this folder structure:

```text
tools/migration/images/
  products/66145932.jpeg
  frames/13063010.png
  objects/59254602.jfif
  ultra-objects/...
  combos/...
```

Filenames must match the `imageUrl` values already in your seeded database.

2. Run the upload script:

```powershell
npm run s3:upload-catalog --workspace=apps/api
```

Or with a custom folder:

```powershell
npm run s3:upload-catalog --workspace=apps/api -- --dir D:\facecraft-images
```

---

## Test photographer upload

1. Seed the database: `npm run db:seed`
2. Log in at http://localhost:3000/photographer/login
   - Use a seeded photographer username (e.g. from `tools/migration/normalized/users.json` where `isPhotographer: true`)
   - Password: `password123`
3. Select photos and click **Upload**
4. Verify in AWS S3 Console under `originals/{userId}/...`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API won't start — missing env vars | Fill in all required vars in `apps/api/.env` |
| `AccessDenied` on upload | Check IAM policy includes `s3:PutObject` on your bucket |
| Images don't display in admin | Ensure `imageUrl` in DB is an S3 key (e.g. `catalog/products/...`) not just a filename |
| `Failed to fetch` on upload | **Missing S3 CORS** — add the CORS rule in Step 2b (credentials are usually fine if `/upload-url` returns 201) |
| CORS error on S3 PUT | Same fix as above — bucket must allow PUT from your web origin |
| Rekognition error on startup | Ensure Rekognition permissions are attached; collection is auto-created |

---

## Cost note

S3 storage is cheap (~$0.023/GB/month in ap-southeast-1). With lifecycle rules deleting photos after 7 days, dev costs should stay under a few dollars per month.
