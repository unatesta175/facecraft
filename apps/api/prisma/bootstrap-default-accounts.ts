import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'password123';

const DEFAULT_ADMIN = {
  id: 'user-01',
  staffCode: 'Fc101',
  name: 'Ahmad Razif',
  username: 'ahmad.razif',
  email: 'admin@facecraft.com',
  phone: '+60123456701',
  locationArea: 'Kuala Lumpur',
  role: 'ADMIN' as const,
  deletePermission: true,
};

const DEFAULT_PHOTOGRAPHER = {
  id: 'user-03',
  staffCode: 'Fc103',
  name: 'Haris Farhan',
  username: 'haris.farhan',
  email: 'photographer@facecraft.com',
  phone: '+60123456703',
  locationArea: 'Shah Alam',
  role: 'STAFF' as const,
  deletePermission: false,
  isPhotographer: true,
};

const DEFAULT_KIOSK = {
  id: 'kiosk-01',
  name: 'Main Lobby Kiosk',
  username: 'kiosk01',
  description: 'Primary kiosk at main lobby',
  status: 'ACTIVE' as const,
};

async function hashPassword() {
  return bcrypt.hash(DEFAULT_PASSWORD, 12);
}

async function ensureAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: {
      status: 'ACTIVE',
      role: { in: ['ADMIN', 'MANAGER'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  const passwordHash = await hashPassword();
  const byEmail = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
  });

  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        role: 'ADMIN',
      },
    });
  }

  return prisma.user.create({
    data: {
      ...DEFAULT_ADMIN,
      passwordHash,
      status: 'ACTIVE',
      isPhotographer: false,
    },
  });
}

async function ensurePhotographer() {
  const existingPhotographer = await prisma.user.findFirst({
    where: {
      status: 'ACTIVE',
      isPhotographer: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingPhotographer) {
    return existingPhotographer;
  }

  const passwordHash = await hashPassword();
  const byUsername = await prisma.user.findUnique({
    where: { username: DEFAULT_PHOTOGRAPHER.username },
  });

  if (byUsername) {
    return prisma.user.update({
      where: { id: byUsername.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        isPhotographer: true,
      },
    });
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: DEFAULT_PHOTOGRAPHER.email },
  });

  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        isPhotographer: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      ...DEFAULT_PHOTOGRAPHER,
      passwordHash,
      status: 'ACTIVE',
    },
  });
}

async function ensureKiosk() {
  const existingKiosk = await prisma.kiosk.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  if (existingKiosk) {
    return existingKiosk;
  }

  const passwordHash = await hashPassword();
  const byUsername = await prisma.kiosk.findUnique({
    where: { username: DEFAULT_KIOSK.username },
  });

  if (byUsername) {
    return prisma.kiosk.update({
      where: { id: byUsername.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
      },
    });
  }

  return prisma.kiosk.create({
    data: {
      ...DEFAULT_KIOSK,
      passwordHash,
    },
  });
}

async function main() {
  const admin = await ensureAdmin();
  const photographer = await ensurePhotographer();
  const kiosk = await ensureKiosk();
  const passwordHash = await hashPassword();

  await prisma.user.updateMany({
    where: { id: { in: [admin.id, photographer.id] } },
    data: { passwordHash },
  });
  await prisma.kiosk.update({
    where: { id: kiosk.id },
    data: { passwordHash },
  });

  console.log('Default accounts ready:');
  console.log(`  Admin: ${admin.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Photographer: ${photographer.username} / ${DEFAULT_PASSWORD}`);
  console.log(`  Kiosk: ${kiosk.username} / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
