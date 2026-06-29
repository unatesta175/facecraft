#!/usr/bin/env tsx
/**
 * Upload brand assets to S3.
 *
 * Usage (from repo root):
 *   npm run s3:upload-brand-logo --workspace=apps/api -- path/to/image.png
 *   npm run s3:upload-brand-logo --workspace=apps/api -- path/to/image.png admin
 *   npm run s3:upload-brand-logo --workspace=apps/api -- path/to/image.png spinner
 *
 * Asset types:
 *   brand (default) -> branding/facecraft-brand-logo.png   (login + home)
 *   admin           -> branding/facecraft-admin-logo.png   (admin + photographer topbar)
 *   spinner         -> branding/facecraft-spinner-emblem.png
 */

import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

type AssetType = 'brand' | 'admin' | 'spinner';

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'avif') return 'image/avif';
  if (ext === 'jfif') return 'image/jpeg';
  return 'image/jpeg';
}

function resolveAsset(type: AssetType): { s3Key: string; envVar: string } {
  if (type === 'spinner') {
    return {
      s3Key: process.env.BRAND_SPINNER_S3_KEY ?? 'branding/facecraft-spinner-emblem.png',
      envVar: 'BRAND_SPINNER_S3_KEY',
    };
  }
  if (type === 'admin') {
    return {
      s3Key: process.env.BRAND_ADMIN_LOGO_S3_KEY ?? 'branding/facecraft-admin-logo.png',
      envVar: 'BRAND_ADMIN_LOGO_S3_KEY',
    };
  }
  return {
    s3Key: process.env.BRAND_LOGO_S3_KEY ?? 'branding/facecraft-brand-logo.png',
    envVar: 'BRAND_LOGO_S3_KEY',
  };
}

async function main() {
  const filePath = process.argv[2];
  const typeArg = process.argv[3];
  const assetType: AssetType =
    typeArg === 'admin' || typeArg === 'spinner' ? typeArg : 'brand';

  if (!filePath) {
    console.error(
      'Usage: npm run s3:upload-brand-logo --workspace=apps/api -- path/to/image.png [brand|admin|spinner]'
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION ?? 'ap-southeast-1';
  const { s3Key, envVar } = resolveAsset(assetType);

  if (!bucket) {
    console.error('Missing S3_BUCKET_NAME in apps/api/.env');
    process.exit(1);
  }

  const client = new S3Client({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  const body = fs.readFileSync(resolvedPath);
  const contentType = getContentType(resolvedPath);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: body,
      ContentType: contentType,
    })
  );

  console.log(`Uploaded ${resolvedPath}`);
  console.log(`Asset type: ${assetType}`);
  console.log(`S3 key: ${s3Key}`);
  console.log(`Bucket: ${bucket}`);
  console.log('');
  console.log('Add to apps/api/.env if not already set:');
  console.log(`${envVar}=${s3Key}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
