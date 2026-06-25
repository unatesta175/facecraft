#!/usr/bin/env tsx
/**
 * Upload catalog images from a local folder to S3 and update DB imageUrl fields.
 *
 * Usage (from repo root):
 *   npm run s3:upload-catalog --workspace=apps/api -- --dir path/to/images
 *
 * Files can live in any subfolder under images/ — matching is done by filename
 * against the database (case-insensitive), not by folder name.
 */

import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { toCatalogKey } from './seed-from-json';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

type Category = 'products' | 'frames' | 'objects' | 'ultra-objects' | 'combos';

type DbMatch = {
  category: Category;
  id: string;
  field: 'imageUrl' | 'thumbnailUrl';
};

const CATEGORY_DIRS: Category[] = ['products', 'frames', 'objects', 'ultra-objects', 'combos'];

function fileBaseName(value: string): string {
  const name = value.includes('/') ? value.split('/').pop()! : value;
  return name.toLowerCase();
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'avif') return 'image/avif';
  if (ext === 'jfif') return 'image/jpeg';
  return 'image/jpeg';
}

async function loadDbIndex(): Promise<Map<string, DbMatch>> {
  const index = new Map<string, DbMatch>();

  const [products, frames, objects, ultraObjects, combos] = await Promise.all([
    prisma.product.findMany({ select: { id: true, imageUrl: true } }),
    prisma.frame.findMany({ select: { id: true, imageUrl: true } }),
    prisma.objectMaster.findMany({ select: { id: true, imageUrl: true } }),
    prisma.ultraObject.findMany({ select: { id: true, imageUrl: true } }),
    prisma.comboProduct.findMany({ select: { id: true, thumbnailUrl: true } }),
  ]);

  for (const row of products) {
    if (row.imageUrl) index.set(fileBaseName(row.imageUrl), { category: 'products', id: row.id, field: 'imageUrl' });
  }
  for (const row of frames) {
    if (row.imageUrl) index.set(fileBaseName(row.imageUrl), { category: 'frames', id: row.id, field: 'imageUrl' });
  }
  for (const row of objects) {
    if (row.imageUrl) index.set(fileBaseName(row.imageUrl), { category: 'objects', id: row.id, field: 'imageUrl' });
  }
  for (const row of ultraObjects) {
    if (row.imageUrl) index.set(fileBaseName(row.imageUrl), { category: 'ultra-objects', id: row.id, field: 'imageUrl' });
  }
  for (const row of combos) {
    if (row.thumbnailUrl) {
      index.set(fileBaseName(row.thumbnailUrl), { category: 'combos', id: row.id, field: 'thumbnailUrl' });
    }
  }

  return index;
}

function collectImageFiles(imagesRoot: string): string[] {
  const files: string[] = [];

  for (const dirName of CATEGORY_DIRS) {
    const categoryDir = path.join(imagesRoot, dirName);
    if (!fs.existsSync(categoryDir)) continue;
    for (const name of fs.readdirSync(categoryDir)) {
      if (name.startsWith('.')) continue;
      files.push(path.join(categoryDir, name));
    }
  }

  return files;
}

async function updateDb(match: DbMatch, s3Key: string): Promise<void> {
  if (match.category === 'products') {
    await prisma.product.update({ where: { id: match.id }, data: { imageUrl: s3Key } });
  } else if (match.category === 'frames') {
    await prisma.frame.update({ where: { id: match.id }, data: { imageUrl: s3Key } });
  } else if (match.category === 'objects') {
    await prisma.objectMaster.update({ where: { id: match.id }, data: { imageUrl: s3Key } });
  } else if (match.category === 'ultra-objects') {
    await prisma.ultraObject.update({ where: { id: match.id }, data: { imageUrl: s3Key } });
  } else if (match.category === 'combos') {
    await prisma.comboProduct.update({ where: { id: match.id }, data: { thumbnailUrl: s3Key } });
  }
}

async function main() {
  const dirArgIndex = process.argv.indexOf('--dir');
  const imagesRoot =
    dirArgIndex >= 0 ? process.argv[dirArgIndex + 1] : path.resolve(__dirname, '../../../tools/migration/images');

  if (!imagesRoot || !fs.existsSync(imagesRoot)) {
    console.error(`❌ Image directory not found: ${imagesRoot}`);
    console.error('Create it or pass --dir path/to/images');
    process.exit(1);
  }

  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'ap-southeast-1';

  if (!bucket) {
    console.error('❌ S3_BUCKET_NAME is required in apps/api/.env');
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

  const dbIndex = await loadDbIndex();
  const imageFiles = collectImageFiles(imagesRoot);
  const seenBasenames = new Set<string>();

  let uploaded = 0;
  let missing = 0;
  let duplicate = 0;

  console.log(`📂 Scanning ${imageFiles.length} files in ${imagesRoot}`);

  for (const filePath of imageFiles) {
    const filename = path.basename(filePath);
    const base = fileBaseName(filename);

    if (seenBasenames.has(base)) {
      duplicate += 1;
      console.warn(`  ⚠ Duplicate file skipped: ${filename}`);
      continue;
    }
    seenBasenames.add(base);

    const match = dbIndex.get(base);
    if (!match) {
      missing += 1;
      console.warn(`  ⚠ No DB record for ${filename}`);
      continue;
    }

    const s3Key = toCatalogKey(match.category, filename)!;
    const body = fs.readFileSync(filePath);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: body,
        ContentType: getContentType(filename),
      })
    );

    await updateDb(match, s3Key);
    uploaded += 1;
    console.log(`  ✓ ${filename} → ${s3Key} (${match.category})`);
  }

  console.log(`\n✅ Done. Uploaded: ${uploaded}, missing DB matches: ${missing}, duplicates skipped: ${duplicate}`);
}

main()
  .catch((error) => {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
