import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { seedFromJson } from './seed-from-json';

const prisma = new PrismaClient();
const REPO_ROOT = path.resolve(__dirname, '../../..');
const RAW_DIR = path.join(REPO_ROOT, 'tools/migration/raw');

function ensureNormalizedJson() {
  const productsRaw = path.join(RAW_DIR, 'products.json');

  if (!fs.existsSync(productsRaw)) {
    throw new Error(
      'Missing tools/migration/raw/products.json. Add your scraped JSON files to tools/migration/raw/ first.'
    );
  }

  console.log('🔄 Transforming raw JSON → normalized JSON...');
  execSync('python tools/migration/transform_all.py', {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
}

async function main() {
  console.log('🌱 Starting FaceCraft database seed...');
  ensureNormalizedJson();
  await seedFromJson(prisma);
  console.log('✅ Database seeded successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
