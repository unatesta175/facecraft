import { PrismaClient } from '@prisma/client';
import { seedFromJson } from './seed-from-json';

const prisma = new PrismaClient();

seedFromJson(prisma)
  .then(() => {
    console.log('✅ Migration import complete');
  })
  .catch((error) => {
    console.error('❌ Migration import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
