import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  PrismaClient,
  UserRole,
  UserStatus,
  KioskStatus,
  ProductStatus,
  ProductType,
  ComboStatus,
  FrameStatus,
  ObjectStatus,
} from '@prisma/client';

export const NORMALIZED_DIR = path.resolve(__dirname, '../../../tools/migration/normalized');

type SizeRow = { key: string; width: number; height: number; createdAt?: string; aliases?: string[] };
type ProductRow = {
  legacyId: string;
  name: string;
  price: number;
  description?: string | null;
  productType: ProductType;
  photoLimit: number;
  sizeKey?: string | null;
  imageUrl?: string | null;
  status: ProductStatus;
  createdAt?: string;
};
type ComboRow = {
  legacyId: string;
  name: string;
  price: number;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: ComboStatus;
  createdAt?: string;
};
type ComboItemRow = {
  comboLegacyId: string;
  productLegacyId: string;
  quantity: number;
};
type FrameRow = {
  legacyId: string;
  name: string;
  imageUrl?: string | null;
  status: FrameStatus;
  createdAt?: string;
};
type ObjectMasterRow = {
  legacyId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  status: ObjectStatus;
  createdAt?: string;
};
type UltraObjectRow = ObjectMasterRow;
type UltraItemRow = { ultraObjectLegacyId: string; objectMasterLegacyId: string };
type UserRow = {
  legacyId: string;
  staffCode: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  locationArea?: string | null;
  role: UserRole;
  isPhotographer?: boolean;
  deletePermission: boolean;
  profileImageUrl?: string | null;
  status: UserStatus;
  plainPassword: string;
  createdAt?: string;
};
type KioskRow = {
  legacyId: string;
  name: string;
  username: string;
  description?: string | null;
  profileImageUrl?: string | null;
  status: KioskStatus;
  plainPassword: string;
  createdAt?: string;
};
type DiscountRow = {
  code: string;
  amount: number;
  description?: string | null;
  createdAt?: string;
};

function readJson<T>(filename: string): T[] {
  const filePath = path.join(NORMALIZED_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Skipping missing file: ${filename}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function withCreatedAt(createdAt?: string) {
  return createdAt ? { createdAt: new Date(createdAt) } : {};
}

type CatalogCategory = 'products' | 'frames' | 'objects' | 'ultra-objects' | 'combos';

/** Canonical frame preview images (Frame 1–4) used during seed. */
const FRAME_IMAGE_BY_NAME: Record<string, string> = {
  'frame 1': '63698634.png',
  'frame 2': '10183874.png',
  'frame 3': '32734121.png',
  'frame 4': '71407156.png',
};

function resolveFrameImageUrl(name: string, imageUrl?: string | null): string | null {
  const override = FRAME_IMAGE_BY_NAME[name.trim().toLowerCase()];
  return override ?? imageUrl ?? null;
}

function normalizeFilenameExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return filename;
  return filename.slice(0, dot + 1) + filename.slice(dot + 1).toLowerCase();
}

/** Convert legacy bare filenames to S3 catalog keys stored in the database. */
export function toCatalogKey(
  category: CatalogCategory,
  value: string | null | undefined
): string | null {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('catalog/')) {
    const slash = value.lastIndexOf('/');
    const dir = value.slice(0, slash + 1);
    const filename = value.slice(slash + 1);
    return dir + normalizeFilenameExtension(filename);
  }
  return `catalog/${category}/${normalizeFilenameExtension(value)}`;
}

async function clearSeedTables(prisma: PrismaClient) {
  console.log('🧹 Clearing seeded tables...');
  await prisma.orderPhoto.deleteMany();
  await prisma.photographerPhoto.deleteMany();
  await prisma.orderCombo.deleteMany();
  await prisma.order.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.ultraObjectItem.deleteMany();
  await prisma.ultraObject.deleteMany();
  await prisma.objectMaster.deleteMany();
  await prisma.frame.deleteMany();
  await prisma.comboProductItem.deleteMany();
  await prisma.comboProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.size.deleteMany();
  await prisma.user.deleteMany();
  await prisma.kiosk.deleteMany();
}

async function importSizes(prisma: PrismaClient): Promise<Map<string, string>> {
  const rows = readJson<SizeRow>('sizes.json');
  const map = new Map<string, string>();

  for (const row of rows) {
    let size = await prisma.size.findFirst({
      where: { width: row.width, height: row.height },
    });

    if (!size) {
      size = await prisma.size.create({
        data: {
          width: row.width,
          height: row.height,
          ...withCreatedAt(row.createdAt),
        },
      });
    }

    map.set(row.key, size.id);
    for (const alias of row.aliases ?? []) {
      map.set(alias, size.id);
    }
  }

  console.log(`✓ sizes: ${rows.length}`);
  return map;
}

async function importProducts(prisma: PrismaClient, sizeMap: Map<string, string>) {
  const rows = readJson<ProductRow>('products.json');

  for (const row of rows) {
    const sizeId = row.sizeKey ? sizeMap.get(row.sizeKey) : undefined;

    await prisma.product.upsert({
      where: { id: row.legacyId },
      update: {
        name: row.name,
        price: row.price,
        description: row.description,
        productType: row.productType,
        photoLimit: row.photoLimit,
        sizeId: sizeId ?? null,
        imageUrl: toCatalogKey('products', row.imageUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        name: row.name,
        price: row.price,
        description: row.description,
        productType: row.productType,
        photoLimit: row.photoLimit,
        sizeId: sizeId ?? null,
        imageUrl: toCatalogKey('products', row.imageUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ products: ${rows.length}`);
}

async function importComboProducts(prisma: PrismaClient) {
  const rows = readJson<ComboRow>('combo_products.json');

  for (const row of rows) {
    await prisma.comboProduct.upsert({
      where: { id: row.legacyId },
      update: {
        name: row.name,
        price: row.price,
        description: row.description,
        thumbnailUrl: toCatalogKey('combos', row.thumbnailUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        name: row.name,
        price: row.price,
        description: row.description,
        thumbnailUrl: toCatalogKey('combos', row.thumbnailUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ combo_products: ${rows.length}`);
}

export async function importComboProductItems(prisma: PrismaClient) {
  const rows = readJson<ComboItemRow>('combo_product_items.json');
  let imported = 0;

  for (const row of rows) {
    const combo = await prisma.comboProduct.findUnique({ where: { id: row.comboLegacyId } });
    const product = await prisma.product.findUnique({ where: { id: row.productLegacyId } });

    if (!combo || !product) {
      console.warn(
        `⚠ Skipped combo item: combo=${row.comboLegacyId}, product=${row.productLegacyId}`
      );
      continue;
    }

    await prisma.comboProductItem.upsert({
      where: {
        comboProductId_productId: {
          comboProductId: row.comboLegacyId,
          productId: row.productLegacyId,
        },
      },
      update: { quantity: row.quantity },
      create: {
        comboProductId: row.comboLegacyId,
        productId: row.productLegacyId,
        quantity: row.quantity,
      },
    });
    imported += 1;
  }

  console.log(`✓ combo_product_items: ${imported}`);
}

async function importFrames(prisma: PrismaClient) {
  const rows = readJson<FrameRow>('frames.json');

  for (const row of rows) {
    const imageFilename = resolveFrameImageUrl(row.name, row.imageUrl);

    await prisma.frame.upsert({
      where: { id: row.legacyId },
      update: {
        name: row.name,
        imageUrl: toCatalogKey('frames', imageFilename),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        name: row.name,
        imageUrl: toCatalogKey('frames', imageFilename),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ frames: ${rows.length}`);
}

async function importObjectMasters(prisma: PrismaClient) {
  const rows = readJson<ObjectMasterRow>('object_masters.json');

  for (const row of rows) {
    await prisma.objectMaster.upsert({
      where: { id: row.legacyId },
      update: {
        title: row.title,
        description: row.description,
        imageUrl: toCatalogKey('objects', row.imageUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        title: row.title,
        description: row.description,
        imageUrl: toCatalogKey('objects', row.imageUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ object_masters: ${rows.length}`);
}

async function importUltraObjects(prisma: PrismaClient) {
  const rows = readJson<UltraObjectRow>('ultra_objects.json');

  for (const row of rows) {
    await prisma.ultraObject.upsert({
      where: { id: row.legacyId },
      update: {
        title: row.title,
        description: row.description,
        imageUrl: toCatalogKey('ultra-objects', row.imageUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        title: row.title,
        description: row.description,
        imageUrl: toCatalogKey('ultra-objects', row.imageUrl),
        status: row.status,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ ultra_objects: ${rows.length}`);
}

async function importUltraObjectItems(prisma: PrismaClient) {
  const rows = readJson<UltraItemRow>('ultra_object_items.json');
  let imported = 0;

  for (const row of rows) {
    const objectMaster = await prisma.objectMaster.findUnique({
      where: { id: row.objectMasterLegacyId },
    });
    const ultraObject = await prisma.ultraObject.findUnique({
      where: { id: row.ultraObjectLegacyId },
    });

    if (!objectMaster || !ultraObject) {
      console.warn(
        `⚠ Skipped ultra item: ultra=${row.ultraObjectLegacyId}, object=${row.objectMasterLegacyId}`
      );
      continue;
    }

    await prisma.ultraObjectItem.upsert({
      where: {
        ultraObjectId_objectId: {
          ultraObjectId: row.ultraObjectLegacyId,
          objectId: row.objectMasterLegacyId,
        },
      },
      update: {},
      create: {
        ultraObjectId: row.ultraObjectLegacyId,
        objectId: row.objectMasterLegacyId,
      },
    });
    imported += 1;
  }

  console.log(`✓ ultra_object_items: ${imported}`);
}

async function importUsers(prisma: PrismaClient) {
  const rows = readJson<UserRow>('users.json');
  const hashCache = new Map<string, string>();

  for (const row of rows) {
    let passwordHash = hashCache.get(row.plainPassword);
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(row.plainPassword, 12);
      hashCache.set(row.plainPassword, passwordHash);
    }

    await prisma.user.upsert({
      where: { id: row.legacyId },
      update: {
        staffCode: row.staffCode,
        name: row.name,
        username: row.username,
        email: row.email,
        phone: row.phone,
        locationArea: row.locationArea,
        role: row.role,
        isPhotographer: row.isPhotographer ?? false,
        deletePermission: row.deletePermission,
        profileImageUrl: row.profileImageUrl,
        status: row.status,
        passwordHash,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        staffCode: row.staffCode,
        name: row.name,
        username: row.username,
        email: row.email,
        phone: row.phone,
        locationArea: row.locationArea,
        role: row.role,
        isPhotographer: row.isPhotographer ?? false,
        deletePermission: row.deletePermission,
        profileImageUrl: row.profileImageUrl,
        status: row.status,
        passwordHash,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ users: ${rows.length}`);
}

async function importKiosks(prisma: PrismaClient) {
  const rows = readJson<KioskRow>('kiosks.json');
  const hashCache = new Map<string, string>();

  for (const row of rows) {
    let passwordHash = hashCache.get(row.plainPassword);
    if (!passwordHash) {
      passwordHash = await bcrypt.hash(row.plainPassword, 12);
      hashCache.set(row.plainPassword, passwordHash);
    }

    await prisma.kiosk.upsert({
      where: { id: row.legacyId },
      update: {
        name: row.name,
        username: row.username,
        description: row.description,
        profileImageUrl: row.profileImageUrl,
        status: row.status,
        passwordHash,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        id: row.legacyId,
        name: row.name,
        username: row.username,
        description: row.description,
        profileImageUrl: row.profileImageUrl,
        status: row.status,
        passwordHash,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ kiosks: ${rows.length}`);
}

async function importDiscounts(prisma: PrismaClient) {
  const rows = readJson<DiscountRow>('discounts.json');

  for (const row of rows) {
    await prisma.discount.upsert({
      where: { code: row.code },
      update: {
        amount: row.amount,
        description: row.description ?? null,
        ...withCreatedAt(row.createdAt),
      },
      create: {
        code: row.code,
        amount: row.amount,
        description: row.description ?? null,
        ...withCreatedAt(row.createdAt),
      },
    });
  }

  console.log(`✓ discounts: ${rows.length}`);
}

export async function seedFromJson(prisma: PrismaClient) {
  if (!fs.existsSync(NORMALIZED_DIR)) {
    throw new Error(
      `Normalized folder not found: ${NORMALIZED_DIR}\nRun: python tools/migration/transform_all.py`
    );
  }

  console.log('📦 Seeding from', NORMALIZED_DIR);

  await clearSeedTables(prisma);

  const sizeMap = await importSizes(prisma);
  await importProducts(prisma, sizeMap);
  await importComboProducts(prisma);
  await importComboProductItems(prisma);
  await importFrames(prisma);
  await importObjectMasters(prisma);
  await importUltraObjects(prisma);
  await importUltraObjectItems(prisma);
  await importUsers(prisma);
  await importKiosks(prisma);
  await importDiscounts(prisma);

  const [sizeCount, productCount, comboCount, comboItemCount, frameCount, objectCount, ultraCount, ultraItemCount, userCount, kioskCount, discountCount] =
    await Promise.all([
      prisma.size.count(),
      prisma.product.count(),
      prisma.comboProduct.count(),
      prisma.comboProductItem.count(),
      prisma.frame.count(),
      prisma.objectMaster.count(),
      prisma.ultraObject.count(),
      prisma.ultraObjectItem.count(),
      prisma.user.count(),
      prisma.kiosk.count(),
      prisma.discount.count(),
    ]);

  console.log('\n📊 Seeded record counts:');
  console.log(`   sizes: ${sizeCount}, products: ${productCount}, combo_products: ${comboCount}, combo_product_items: ${comboItemCount}`);
  console.log(`   frames: ${frameCount}, object_masters: ${objectCount}`);
  console.log(`   ultra_objects: ${ultraCount}, ultra_object_items: ${ultraItemCount}`);
  console.log(`   users: ${userCount}, kiosks: ${kioskCount}, discounts: ${discountCount}`);
}
