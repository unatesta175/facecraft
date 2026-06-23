import { PrismaClient, UserRole, UserStatus, KioskStatus, ProductStatus, ProductType, ComboStatus, FrameStatus, ObjectStatus, PaymentType, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function orderCode(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `ORD-${mm}${dd}${rand}`;
}

function comboCode(): string {
  return `#${Math.floor(Math.random() * 9000000000000) + 1000000000000}`;
}

async function main() {
  console.log('🌱 Starting FaceCraft database seed...');

  const hash = await bcrypt.hash('password123', 12);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { staffCode: 'Fc101' },
      update: {},
      create: {
        staffCode: 'Fc101', name: 'Ahmad Razif', username: 'ahmad.razif',
        passwordHash: hash, email: 'admin@facecraft.com', phone: '+60123456701',
        locationArea: 'Kuala Lumpur', role: UserRole.ADMIN,
        deletePermission: true, status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.upsert({
      where: { staffCode: 'Fc102' },
      update: {},
      create: {
        staffCode: 'Fc102', name: 'Siti Nabilah', username: 'siti.nabilah',
        passwordHash: hash, email: 'manager@facecraft.com', phone: '+60123456702',
        locationArea: 'Petaling Jaya', role: UserRole.MANAGER,
        deletePermission: false, status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.upsert({
      where: { staffCode: 'Fc103' },
      update: {},
      create: {
        staffCode: 'Fc103', name: 'Haris Farhan', username: 'haris.farhan',
        passwordHash: hash, email: 'photographer@facecraft.com', phone: '+60123456703',
        locationArea: 'Shah Alam', role: UserRole.STAFF,
        deletePermission: false, status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.upsert({
      where: { staffCode: 'Fc104' },
      update: {},
      create: {
        staffCode: 'Fc104', name: 'Nurul Ain', username: 'nurul.ain',
        passwordHash: hash, email: 'staff2@facecraft.com', phone: '+60123456704',
        locationArea: 'Subang Jaya', role: UserRole.STAFF,
        deletePermission: false, status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.upsert({
      where: { staffCode: 'Fc105' },
      update: {},
      create: {
        staffCode: 'Fc105', name: 'Rizal Hakim', username: 'rizal.hakim',
        passwordHash: hash, email: 'staff3@facecraft.com', phone: '+60123456705',
        locationArea: 'Cyberjaya', role: UserRole.STAFF,
        deletePermission: false, status: UserStatus.INACTIVE,
      },
    }),
    prisma.user.upsert({
      where: { staffCode: 'Fc106' },
      update: {},
      create: {
        staffCode: 'Fc106', name: 'Thiviya Mogan', username: 'thiviya.mogan',
        passwordHash: hash, email: 'supervisor@facecraft.com', phone: '+60123456706',
        locationArea: 'Putrajaya', role: UserRole.SUPERVISOR,
        deletePermission: false, status: UserStatus.ACTIVE,
      },
    }),
  ]);

  // ── Kiosks ─────────────────────────────────────────────────────────────────
  console.log('Creating kiosks...');
  const kioskPwHash = await bcrypt.hash('kiosk123', 12);
  const kiosks = await Promise.all([
    prisma.kiosk.upsert({
      where: { username: 'kiosk01' },
      update: {},
      create: { name: 'Main Lobby Kiosk', username: 'kiosk01', passwordHash: kioskPwHash, description: 'Primary kiosk at main lobby entrance', status: KioskStatus.ACTIVE },
    }),
    prisma.kiosk.upsert({
      where: { username: 'kiosk02' },
      update: {},
      create: { name: 'Hall A Kiosk', username: 'kiosk02', passwordHash: kioskPwHash, description: 'Hall A — wedding events', status: KioskStatus.ACTIVE },
    }),
    prisma.kiosk.upsert({
      where: { username: 'kiosk03' },
      update: {},
      create: { name: 'Hall B Kiosk', username: 'kiosk03', passwordHash: kioskPwHash, description: 'Hall B — corporate events', status: KioskStatus.ACTIVE },
    }),
    prisma.kiosk.upsert({
      where: { username: 'kiosk04' },
      update: {},
      create: { name: 'Outdoor Kiosk', username: 'kiosk04', passwordHash: kioskPwHash, description: 'Outdoor garden area', status: KioskStatus.INACTIVE },
    }),
    prisma.kiosk.upsert({
      where: { username: 'kiosk05' },
      update: {},
      create: { name: 'VIP Lounge Kiosk', username: 'kiosk05', passwordHash: kioskPwHash, description: 'VIP lounge and private events', status: KioskStatus.ACTIVE },
    }),
  ]);

  // ── Sizes ──────────────────────────────────────────────────────────────────
  console.log('Creating sizes...');
  const sizes = await Promise.all([
    prisma.size.upsert({ where: { id: 'size-4x6' }, update: {}, create: { id: 'size-4x6', height: 4, width: 6 } }),
    prisma.size.upsert({ where: { id: 'size-5x7' }, update: {}, create: { id: 'size-5x7', height: 5, width: 7 } }),
    prisma.size.upsert({ where: { id: 'size-8x10' }, update: {}, create: { id: 'size-8x10', height: 8, width: 10 } }),
  ]);

  // ── Products ───────────────────────────────────────────────────────────────
  console.log('Creating products...');
  const productDefs = [
    { id: 'prod-01', name: '4x6 Standard Print', price: 5.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[0].id },
    { id: 'prod-02', name: '5x7 Standard Print', price: 8.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-03', name: '8x10 Large Print', price: 15.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-04', name: 'Magnetic Photo 4x6', price: 12.00, productType: ProductType.MAGNET, photoLimit: 1, sizeId: sizes[0].id },
    { id: 'prod-05', name: 'Magnetic Photo 5x7', price: 18.00, productType: ProductType.MAGNET, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-06', name: 'Email Digital Copy HD', price: 10.00, productType: ProductType.EMAIL, photoLimit: 5, sizeId: null },
    { id: 'prod-07', name: 'Email Digital Copy 4K', price: 15.00, productType: ProductType.EMAIL, photoLimit: 10, sizeId: null },
    { id: 'prod-08', name: 'Certificate Left Style 1', price: 22.00, productType: ProductType.CERTIFICATE_LEFT_1, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-09', name: 'Certificate Left Style 2', price: 22.00, productType: ProductType.CERTIFICATE_LEFT_2, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-10', name: 'Certificate Right Style 1', price: 22.00, productType: ProductType.CERTIFICATE_RIGHT_1, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-11', name: 'Wallet Print x4', price: 9.00, productType: ProductType.OTHERS, photoLimit: 4, sizeId: sizes[0].id },
    { id: 'prod-12', name: 'Postcard Print', price: 7.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-13', name: 'Canvas Print 8x10', price: 45.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-14', name: 'Photo Book Single Page', price: 20.00, productType: ProductType.OTHERS, photoLimit: 2, sizeId: sizes[1].id },
    { id: 'prod-15', name: 'Panoramic Print', price: 25.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-16', name: 'Keychain Photo Print', price: 6.00, productType: ProductType.MAGNET, photoLimit: 1, sizeId: sizes[0].id },
    { id: 'prod-17', name: 'Fridge Magnet Set x2', price: 14.00, productType: ProductType.MAGNET, photoLimit: 2, sizeId: sizes[0].id },
    { id: 'prod-18', name: 'Email Family Album', price: 30.00, productType: ProductType.EMAIL, photoLimit: 20, sizeId: null },
    { id: 'prod-19', name: 'Graduation Certificate', price: 28.00, productType: ProductType.CERTIFICATE_LEFT_1, photoLimit: 1, sizeId: sizes[2].id },
    { id: 'prod-20', name: 'Event Certificate', price: 18.00, productType: ProductType.CERTIFICATE_RIGHT_1, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-21', name: '4x6 Matte Print', price: 6.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[0].id },
    { id: 'prod-22', name: '5x7 Glossy Print', price: 9.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-23', name: 'Square Print 5x5', price: 8.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-24', name: 'Bookmark Photo', price: 5.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[0].id },
    { id: 'prod-25', name: 'Coaster Photo Set', price: 16.00, productType: ProductType.MAGNET, photoLimit: 4, sizeId: sizes[0].id },
    { id: 'prod-26', name: 'Calendar Page', price: 12.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[1].id },
    { id: 'prod-27', name: 'Mug Print Design', price: 20.00, productType: ProductType.EMAIL, photoLimit: 1, sizeId: null },
    { id: 'prod-28', name: 'Tote Bag Design', price: 25.00, productType: ProductType.EMAIL, photoLimit: 1, sizeId: null },
    { id: 'prod-29', name: 'T-Shirt Design File', price: 18.00, productType: ProductType.EMAIL, photoLimit: 1, sizeId: null },
    { id: 'prod-30', name: 'Photo Strip x3', price: 11.00, productType: ProductType.OTHERS, photoLimit: 3, sizeId: sizes[0].id },
    { id: 'prod-31', name: 'Instant Print 3x4', price: 4.00, productType: ProductType.OTHERS, photoLimit: 1, sizeId: sizes[0].id },
  ];

  const products = await Promise.all(
    productDefs.map((d) =>
      prisma.product.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id, name: d.name, price: d.price,
          description: `High quality ${d.name.toLowerCase()} for your memories`,
          productType: d.productType, photoLimit: d.photoLimit,
          sizeId: d.sizeId, status: ProductStatus.ACTIVE,
        },
      })
    )
  );

  // ── Combo Products ─────────────────────────────────────────────────────────
  console.log('Creating combo products...');
  const comboDefs = [
    { id: 'combo-01', name: 'Heritage Ultimate - VIP Priority', price: 499.00, productIds: ['prod-03', 'prod-08', 'prod-07', 'prod-13'] },
    { id: 'combo-02', name: 'Heritage Premium', price: 399.00, productIds: ['prod-03', 'prod-08', 'prod-06'] },
    { id: 'combo-03', name: 'Supreme 1', price: 300.00, productIds: ['prod-03', 'prod-02', 'prod-06'] },
    { id: 'combo-04', name: 'Heritage Book', price: 199.00, productIds: ['prod-14', 'prod-02', 'prod-06'] },
    { id: 'combo-05', name: 'Premium Full Experience', price: 169.00, productIds: ['prod-03', 'prod-02', 'prod-04'] },
    { id: 'combo-06', name: 'Portrait Premium 1', price: 150.00, productIds: ['prod-03', 'prod-02', 'prod-01'] },
    { id: 'combo-07', name: 'Portrait Digital Pack', price: 99.00, productIds: ['prod-02', 'prod-07', 'prod-01'] },
    { id: 'combo-08', name: 'Print & Digital Pack', price: 59.00, productIds: ['prod-01', 'prod-06', 'prod-11'] },
    { id: 'combo-09', name: 'Basic Print Pack', price: 50.00, productIds: ['prod-01', 'prod-02', 'prod-11'] },
    { id: 'combo-10', name: 'Digital Package', price: 89.00, productIds: ['prod-06', 'prod-07', 'prod-18'] },
    { id: 'combo-11', name: 'Starter Memories', price: 35.00, productIds: ['prod-01', 'prod-11', 'prod-24'] },
    { id: 'combo-12', name: 'Family Bundle', price: 85.00, productIds: ['prod-02', 'prod-03', 'prod-11', 'prod-06'] },
    { id: 'combo-13', name: 'Wedding Classic', price: 250.00, productIds: ['prod-03', 'prod-08', 'prod-15', 'prod-13'] },
    { id: 'combo-14', name: 'Wedding Premium', price: 350.00, productIds: ['prod-03', 'prod-08', 'prod-15', 'prod-13', 'prod-07'] },
    { id: 'combo-15', name: 'Corporate Event Pack', price: 180.00, productIds: ['prod-09', 'prod-03', 'prod-07'] },
    { id: 'combo-16', name: 'Graduate Special', price: 120.00, productIds: ['prod-19', 'prod-03', 'prod-06'] },
    { id: 'combo-17', name: 'Magnet Memories', price: 45.00, productIds: ['prod-04', 'prod-05', 'prod-17'] },
    { id: 'combo-18', name: 'Souvenir Set', price: 55.00, productIds: ['prod-16', 'prod-25', 'prod-04'] },
    { id: 'combo-19', name: 'Mini Pack', price: 25.00, productIds: ['prod-31', 'prod-30', 'prod-24'] },
    { id: 'combo-20', name: 'Expression Pack', price: 75.00, productIds: ['prod-02', 'prod-22', 'prod-07'] },
    { id: 'combo-21', name: 'Square Album', price: 68.00, productIds: ['prod-23', 'prod-14', 'prod-06'] },
    { id: 'combo-22', name: 'Calendar Pack', price: 95.00, productIds: ['prod-26', 'prod-02', 'prod-07'] },
    { id: 'combo-23', name: 'Merchandise Pack', price: 110.00, productIds: ['prod-27', 'prod-28', 'prod-06'] },
    { id: 'combo-24', name: 'Fashion Pack', price: 130.00, productIds: ['prod-29', 'prod-28', 'prod-07'] },
    { id: 'combo-25', name: 'Postcard Bundle', price: 40.00, productIds: ['prod-12', 'prod-01', 'prod-24'] },
    { id: 'combo-26', name: 'Strip Pack', price: 30.00, productIds: ['prod-30', 'prod-31', 'prod-24'] },
    { id: 'combo-27', name: 'Panoramic Bundle', price: 90.00, productIds: ['prod-15', 'prod-03', 'prod-06'] },
    { id: 'combo-28', name: 'All-In-One Elite', price: 599.00, productIds: ['prod-03', 'prod-08', 'prod-13', 'prod-07', 'prod-18'] },
  ];

  const combos = await Promise.all(
    comboDefs.map((d) =>
      prisma.comboProduct.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id, name: d.name, price: d.price,
          description: `Combo package: ${d.name}`,
          status: ComboStatus.ACTIVE,
          items: {
            create: d.productIds.map((pid, i) => ({ productId: pid, quantity: i === 0 ? 2 : 1 })),
          },
        },
      })
    )
  );

  // ── Discounts ──────────────────────────────────────────────────────────────
  console.log('Creating discounts...');
  const discounts = await Promise.all([
    prisma.discount.upsert({ where: { code: 'WELCOME10' }, update: {}, create: { code: 'WELCOME10', amount: 10.00, description: '10% off for new customers' } }),
    prisma.discount.upsert({ where: { code: 'SUMMER25' }, update: {}, create: { code: 'SUMMER25', amount: 25.00, description: 'Summer promotion RM25 off' } }),
    prisma.discount.upsert({ where: { code: 'VIP50' }, update: {}, create: { code: 'VIP50', amount: 50.00, description: 'VIP exclusive RM50 off' } }),
    prisma.discount.upsert({ where: { code: 'WEDDING15' }, update: {}, create: { code: 'WEDDING15', amount: 15.00, description: 'Wedding package discount' } }),
    prisma.discount.upsert({ where: { code: 'STAFF20' }, update: {}, create: { code: 'STAFF20', amount: 20.00, description: 'Staff member discount' } }),
  ]);

  // ── Frames ─────────────────────────────────────────────────────────────────
  console.log('Creating frames...');
  const frameNames = [
    'Classic Gold Border', 'Modern Minimalist', 'Vintage Floral', 'Wedding White',
    'Corporate Blue', 'Birthday Confetti', 'Christmas Theme', 'Eid Mubarak',
    'Graduation Cap', 'Nature Leaves', 'Abstract Art', 'Black & White Film',
    'Rustic Wood', 'Luxury Marble',
  ];
  const frames = await Promise.all(
    frameNames.map((name, i) =>
      prisma.frame.upsert({
        where: { id: `frame-${String(i + 1).padStart(2, '0')}` },
        update: {},
        create: {
          id: `frame-${String(i + 1).padStart(2, '0')}`,
          name, imageUrl: `https://placeholder.co/300x200?text=${encodeURIComponent(name)}`,
          status: i < 12 ? FrameStatus.ACTIVE : FrameStatus.INACTIVE,
        },
      })
    )
  );

  // ── Object Masters ─────────────────────────────────────────────────────────
  console.log('Creating object masters...');
  const objectDefs = [
    { id: 'obj-01', title: 'Rose Bouquet', description: 'Elegant red rose arrangement' },
    { id: 'obj-02', title: 'Butterfly Wings', description: 'Colorful butterfly decoration' },
    { id: 'obj-03', title: 'Star Sparkle', description: 'Glittery star overlay' },
    { id: 'obj-04', title: 'Heart Frame', description: 'Romantic heart shaped frame' },
    { id: 'obj-05', title: 'Leaf Wreath', description: 'Natural green leaf wreath' },
    { id: 'obj-06', title: 'Balloons', description: 'Festive balloon cluster' },
    { id: 'obj-07', title: 'Confetti Burst', description: 'Colorful confetti explosion' },
    { id: 'obj-08', title: 'Feather Plume', description: 'Elegant white feather decoration' },
    { id: 'obj-09', title: 'Crown Ornament', description: 'Royal gold crown accessory' },
    { id: 'obj-10', title: 'Ribbon Bow', description: 'Decorative silk ribbon bow' },
  ];
  const objects = await Promise.all(
    objectDefs.map((d) =>
      prisma.objectMaster.upsert({
        where: { id: d.id }, update: {},
        create: { ...d, imageUrl: `https://placeholder.co/100x100?text=${encodeURIComponent(d.title)}`, status: ObjectStatus.ACTIVE },
      })
    )
  );

  // ── Ultra Objects ──────────────────────────────────────────────────────────
  console.log('Creating ultra objects...');
  await Promise.all([
    prisma.ultraObject.upsert({
      where: { id: 'ultra-01' }, update: {},
      create: {
        id: 'ultra-01', title: 'Wedding Decoration Set', description: 'Complete wedding overlay collection',
        imageUrl: 'https://placeholder.co/200x150?text=Wedding', status: ObjectStatus.ACTIVE,
        items: { create: [{ objectId: 'obj-01' }, { objectId: 'obj-04' }, { objectId: 'obj-10' }] },
      },
    }),
    prisma.ultraObject.upsert({
      where: { id: 'ultra-02' }, update: {},
      create: {
        id: 'ultra-02', title: 'Party Celebration Set', description: 'Fun party decoration collection',
        imageUrl: 'https://placeholder.co/200x150?text=Party', status: ObjectStatus.ACTIVE,
        items: { create: [{ objectId: 'obj-06' }, { objectId: 'obj-07' }, { objectId: 'obj-03' }] },
      },
    }),
  ]);

  // ── Orders ─────────────────────────────────────────────────────────────────
  console.log('Creating orders...');
  const staffUsers = users.filter((u) => u.role === UserRole.STAFF || u.role === UserRole.MANAGER);
  const activeKiosks = kiosks.filter((k) => k.status === KioskStatus.ACTIVE);
  const paymentTypes = [PaymentType.CASH, PaymentType.CARD, PaymentType.QR];
  const statuses = [PaymentStatus.COMPLETED, PaymentStatus.COMPLETED, PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.CANCELLED];

  const today = new Date();

  for (let i = 0; i < 42; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - daysAgo);
    const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    const hours = String(Math.floor(Math.random() * 12) + 9).padStart(2, '0');
    const mins = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    const combo = rnd(combos);
    const staff = rnd(staffUsers);
    const kiosk = rnd(activeKiosks);
    const discount = Math.random() > 0.7 ? rnd(discounts) : null;
    const pStatus = rnd(statuses);

    const existing = await prisma.order.findFirst({ where: { orderCode: { startsWith: 'ORD-' }, kioskId: kiosk.id, staffId: staff.id } });
    const code = `ORD-${String(i + 1).padStart(3, '0')}-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        orderCode: code,
        kioskId: kiosk.id,
        staffId: staff.id,
        discountId: discount?.id ?? null,
        date: orderDateOnly,
        time: `${hours}:${mins}`,
        paymentType: rnd(paymentTypes),
        price: Number(combo.price) - (discount ? Number(discount.amount) : 0),
        paymentStatus: pStatus,
        orderCombos: {
          create: [{
            comboProductId: combo.id,
            comboCode: comboCode(),
            priceSnapshot: combo.price,
            descriptionSnapshot: combo.description,
            orderPhotos: {
              create: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => ({
                productId: rnd(products).id,
                photographerId: rnd(staffUsers).id,
                frameId: rnd(frames).id,
                folderLabel: `Photo Folder X ${j + 1}`,
                imageUrl: `https://placeholder.co/800x600?text=Photo+${i + 1}-${j + 1}`,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              })),
            },
          }],
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin:    admin@facecraft.com / password123');
  console.log('  Manager:  manager@facecraft.com / password123');
  console.log('  Staff:    photographer@facecraft.com / password123');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
