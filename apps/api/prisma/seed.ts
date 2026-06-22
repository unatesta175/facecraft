import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Permissions
  console.log('Creating permissions...');
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'users:read' },
      update: {},
      create: { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
    }),
    prisma.permission.upsert({
      where: { name: 'users:write' },
      update: {},
      create: { name: 'users:write', resource: 'users', action: 'write', description: 'Create/update users' },
    }),
    prisma.permission.upsert({
      where: { name: 'photos:read' },
      update: {},
      create: { name: 'photos:read', resource: 'photos', action: 'read', description: 'View photos' },
    }),
    prisma.permission.upsert({
      where: { name: 'photos:write' },
      update: {},
      create: { name: 'photos:write', resource: 'photos', action: 'write', description: 'Upload photos' },
    }),
    prisma.permission.upsert({
      where: { name: 'orders:read' },
      update: {},
      create: { name: 'orders:read', resource: 'orders', action: 'read', description: 'View orders' },
    }),
    prisma.permission.upsert({
      where: { name: 'orders:write' },
      update: {},
      create: { name: 'orders:write', resource: 'orders', action: 'write', description: 'Manage orders' },
    }),
    prisma.permission.upsert({
      where: { name: 'products:read' },
      update: {},
      create: { name: 'products:read', resource: 'products', action: 'read', description: 'View products' },
    }),
    prisma.permission.upsert({
      where: { name: 'products:write' },
      update: {},
      create: { name: 'products:write', resource: 'products', action: 'write', description: 'Manage products' },
    }),
  ]);

  // Create Roles
  console.log('Creating roles...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super administrator with full access',
      permissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with management access',
      permissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  const photographerRole = await prisma.role.upsert({
    where: { name: 'PHOTOGRAPHER' },
    update: {},
    create: {
      name: 'PHOTOGRAPHER',
      description: 'Photographer with photo management access',
      permissions: {
        create: [
          { permissionId: permissions.find((p) => p.name === 'photos:read')!.id },
          { permissionId: permissions.find((p) => p.name === 'photos:write')!.id },
          { permissionId: permissions.find((p) => p.name === 'orders:read')!.id },
        ],
      },
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      description: 'Staff member with limited access',
      permissions: {
        create: [
          { permissionId: permissions.find((p) => p.name === 'orders:read')!.id },
          { permissionId: permissions.find((p) => p.name === 'orders:write')!.id },
        ],
      },
    },
  });

  // Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@facecraft.com' },
    update: {},
    create: {
      email: 'superadmin@facecraft.com',
      password: hashedPassword,
      name: 'Super Administrator',
      roles: {
        create: { roleId: superAdminRole.id },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@facecraft.com' },
    update: {},
    create: {
      email: 'admin@facecraft.com',
      password: hashedPassword,
      name: 'System Administrator',
      roles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  const photographerUser = await prisma.user.upsert({
    where: { email: 'photographer@facecraft.com' },
    update: {},
    create: {
      email: 'photographer@facecraft.com',
      password: hashedPassword,
      name: 'John Photographer',
      roles: {
        create: { roleId: photographerRole.id },
      },
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@facecraft.com' },
    update: {},
    create: {
      email: 'staff@facecraft.com',
      password: hashedPassword,
      name: 'Staff Member',
      roles: {
        create: { roleId: staffRole.id },
      },
    },
  });

  // Create Photographer Profile
  console.log('Creating photographer profile...');
  const photographerProfile = await prisma.photographerProfile.upsert({
    where: { userId: photographerUser.id },
    update: {},
    create: {
      userId: photographerUser.id,
      businessName: 'FaceCraft Studio',
      phone: '+60123456789',
      address: 'Kuala Lumpur, Malaysia',
    },
  });

  // Create Staff Profile
  await prisma.staffProfile.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      userId: staffUser.id,
      phone: '+60123456788',
    },
  });

  // Create Kiosk
  console.log('Creating kiosk...');
  const kiosk = await prisma.kiosk.upsert({
    where: { deviceId: 'KIOSK-001' },
    update: {},
    create: {
      name: 'Main Kiosk',
      location: 'Studio Lobby',
      deviceId: 'KIOSK-001',
      status: 'ACTIVE',
    },
  });

  // Create Event
  console.log('Creating event...');
  const event = await prisma.event.upsert({
    where: { id: 'event-sample-001' },
    update: {},
    create: {
      id: 'event-sample-001',
      photographerId: photographerProfile.id,
      name: 'Summer Wedding 2026',
      description: 'Beautiful wedding celebration at the beach',
      eventDate: new Date('2026-07-15'),
      location: 'Bali Beach Resort',
    },
  });

  // Create Frames
  console.log('Creating frames...');
  await Promise.all([
    prisma.frame.upsert({
      where: { id: 'frame-classic-001' },
      update: {},
      create: {
        id: 'frame-classic-001',
        name: 'Classic Frame',
        description: 'Elegant classic border',
        s3Key: 'frames/classic.png',
        aspectRatio: '4:3',
        sortOrder: 1,
      },
    }),
    prisma.frame.upsert({
      where: { id: 'frame-modern-001' },
      update: {},
      create: {
        id: 'frame-modern-001',
        name: 'Modern Frame',
        description: 'Sleek modern border',
        s3Key: 'frames/modern.png',
        aspectRatio: '16:9',
        sortOrder: 2,
      },
    }),
    prisma.frame.upsert({
      where: { id: 'frame-vintage-001' },
      update: {},
      create: {
        id: 'frame-vintage-001',
        name: 'Vintage Frame',
        description: 'Retro vintage style',
        s3Key: 'frames/vintage.png',
        aspectRatio: '1:1',
        sortOrder: 3,
      },
    }),
  ]);

  // Create Product Categories
  console.log('Creating product categories...');
  const printCategory = await prisma.productCategory.upsert({
    where: { name: 'Prints' },
    update: {},
    create: {
      name: 'Prints',
      description: 'Photo prints in various sizes',
      sortOrder: 1,
    },
  });

  const frameCategory = await prisma.productCategory.upsert({
    where: { name: 'Framed Prints' },
    update: {},
    create: {
      name: 'Framed Prints',
      description: 'Framed photo prints',
      sortOrder: 2,
    },
  });

  const certificateCategory = await prisma.productCategory.upsert({
    where: { name: 'Certificates' },
    update: {},
    create: {
      name: 'Certificates',
      description: 'Professional certificates',
      sortOrder: 3,
    },
  });

  const digitalCategory = await prisma.productCategory.upsert({
    where: { name: 'Digital Products' },
    update: {},
    create: {
      name: 'Digital Products',
      description: 'Digital downloads',
      sortOrder: 4,
    },
  });

  // Create Products
  console.log('Creating products...');
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-print-4x6' },
      update: {},
      create: {
        id: 'product-print-4x6',
        categoryId: printCategory.id,
        name: '4x6 Print',
        description: 'Standard 4x6 inch photo print',
        type: 'PRINT',
        basePrice: 5.00,
        dimensions: { width: 4, height: 6, unit: 'inch' },
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-print-5x7' },
      update: {},
      create: {
        id: 'product-print-5x7',
        categoryId: printCategory.id,
        name: '5x7 Print',
        description: 'Medium 5x7 inch photo print',
        type: 'PRINT',
        basePrice: 8.00,
        dimensions: { width: 5, height: 7, unit: 'inch' },
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-print-8x10' },
      update: {},
      create: {
        id: 'product-print-8x10',
        categoryId: printCategory.id,
        name: '8x10 Print',
        description: 'Large 8x10 inch photo print',
        type: 'PRINT',
        basePrice: 15.00,
        dimensions: { width: 8, height: 10, unit: 'inch' },
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-frame-5x7' },
      update: {},
      create: {
        id: 'product-frame-5x7',
        categoryId: frameCategory.id,
        name: '5x7 Framed Print',
        description: 'Photo in elegant wooden frame',
        type: 'FRAME',
        basePrice: 25.00,
        dimensions: { width: 5, height: 7, unit: 'inch' },
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-frame-8x10' },
      update: {},
      create: {
        id: 'product-frame-8x10',
        categoryId: frameCategory.id,
        name: '8x10 Framed Print',
        description: 'Photo in premium wooden frame',
        type: 'FRAME',
        basePrice: 40.00,
        dimensions: { width: 8, height: 10, unit: 'inch' },
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-certificate' },
      update: {},
      create: {
        id: 'product-certificate',
        categoryId: certificateCategory.id,
        name: 'Professional Certificate',
        description: 'High-quality printed certificate',
        type: 'CERTIFICATE',
        basePrice: 12.00,
        dimensions: { width: 8.5, height: 11, unit: 'inch' },
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-digital-hd' },
      update: {},
      create: {
        id: 'product-digital-hd',
        categoryId: digitalCategory.id,
        name: 'HD Digital Copy',
        description: 'High-definition digital download',
        type: 'DIGITAL',
        basePrice: 10.00,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-digital-4k' },
      update: {},
      create: {
        id: 'product-digital-4k',
        categoryId: digitalCategory.id,
        name: '4K Digital Copy',
        description: 'Ultra HD digital download',
        type: 'DIGITAL',
        basePrice: 15.00,
      },
    }),
  ]);

  // Create Packages
  console.log('Creating packages...');
  await prisma.package.upsert({
    where: { id: 'package-starter' },
    update: {},
    create: {
      id: 'package-starter',
      name: 'Starter Package',
      description: 'Perfect for individuals - 3 prints',
      basePrice: 35.00,
      items: {
        create: [
          {
            productId: products[0].id, // 4x6 Print
            quantity: 2,
            requiredPhotoCount: 2,
          },
          {
            productId: products[1].id, // 5x7 Print
            quantity: 1,
            requiredPhotoCount: 1,
          },
        ],
      },
    },
  });

  await prisma.package.upsert({
    where: { id: 'package-family' },
    update: {},
    create: {
      id: 'package-family',
      name: 'Family Package',
      description: 'Great for families - 6 prints + 1 framed',
      basePrice: 85.00,
      items: {
        create: [
          {
            productId: products[0].id, // 4x6 Print
            quantity: 4,
            requiredPhotoCount: 4,
          },
          {
            productId: products[1].id, // 5x7 Print
            quantity: 2,
            requiredPhotoCount: 2,
          },
          {
            productId: products[3].id, // 5x7 Framed
            quantity: 1,
            requiredPhotoCount: 1,
          },
        ],
      },
    },
  });

  await prisma.package.upsert({
    where: { id: 'package-premium' },
    update: {},
    create: {
      id: 'package-premium',
      name: 'Premium Package',
      description: 'Ultimate collection - prints, frames, and digital',
      basePrice: 150.00,
      items: {
        create: [
          {
            productId: products[0].id, // 4x6 Print
            quantity: 6,
            requiredPhotoCount: 6,
          },
          {
            productId: products[2].id, // 8x10 Print
            quantity: 2,
            requiredPhotoCount: 2,
          },
          {
            productId: products[4].id, // 8x10 Framed
            quantity: 1,
            requiredPhotoCount: 1,
          },
          {
            productId: products[7].id, // 4K Digital
            quantity: 1,
            requiredPhotoCount: 3,
          },
        ],
      },
    },
  });

  // Create Discounts
  console.log('Creating discounts...');
  await Promise.all([
    prisma.discount.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10.00,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        minPurchaseAmount: 30.00,
        maxDiscountAmount: 20.00,
        usageLimit: 100,
      },
    }),
    prisma.discount.upsert({
      where: { code: 'SUMMER25' },
      update: {},
      create: {
        code: 'SUMMER25',
        type: 'FIXED_AMOUNT',
        value: 25.00,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        minPurchaseAmount: 100.00,
        usageLimit: 50,
      },
    }),
    prisma.discount.upsert({
      where: { code: 'EXPIRED' },
      update: {},
      create: {
        code: 'EXPIRED',
        type: 'PERCENTAGE',
        value: 50.00,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    }),
  ]);

  // Create Sample Order
  console.log('Creating sample order...');
  const kioskSession = await prisma.kioskSession.create({
    data: {
      kioskId: kiosk.id,
      sessionToken: 'sample-session-token-001',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: 'ORD-SAMPLE001' },
    update: {},
    create: {
      orderNumber: 'ORD-SAMPLE001',
      photographerId: photographerProfile.id,
      kioskSessionId: kioskSession.id,
      kioskId: kiosk.id,
      subtotal: 35.00,
      discount: 0,
      total: 35.00,
      paymentMethod: 'CARD',
      status: 'COMPLETED',
      paymentStatus: 'COMPLETED',
      statusHistory: {
        create: [
          {
            status: 'PENDING',
            notes: 'Order created',
          },
          {
            status: 'PROCESSING',
            notes: 'Payment confirmed',
          },
          {
            status: 'COMPLETED',
            notes: 'Order fulfilled',
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\nTest accounts created:');
  console.log('Super Admin: superadmin@facecraft.com / password123');
  console.log('Admin: admin@facecraft.com / password123');
  console.log('Photographer: photographer@facecraft.com / password123');
  console.log('Staff: staff@facecraft.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
