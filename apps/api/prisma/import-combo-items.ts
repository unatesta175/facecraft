import { PrismaClient } from '@prisma/client';
import { importComboProductItems } from './seed-from-json';

const prisma = new PrismaClient();

importComboProductItems(prisma)
  .then(() => console.log('✅ Combo product items imported'))
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
