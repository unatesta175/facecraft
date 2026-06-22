import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, createOrderSchema, updateOrderStatusSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';
import { nanoid } from 'nanoid';

export const orderRouter = Router();

orderRouter.post(
  '/',
  validate(z.object({ body: createOrderSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { cartId, paymentMethod, discountCode, staffId } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
            package: true,
            photos: true,
          },
        },
        kioskSession: {
          include: {
            kiosk: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundError('Cart', cartId);
    }

    if (cart.items.length === 0) {
      throw new NotFoundError('Cart items');
    }

    const firstItem = cart.items[0];
    const firstPhoto = await prisma.photo.findFirst({
      where: {
        id: firstItem.photos[0]?.photoId,
      },
    });

    if (!firstPhoto) {
      throw new NotFoundError('Photo for order');
    }

    let discountAmount = 0;
    let discountId = null;

    if (discountCode) {
      const discount = await prisma.discount.findUnique({
        where: { code: discountCode, isActive: true },
      });

      if (discount && discount.startDate <= new Date() && discount.endDate >= new Date()) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = (Number(cart.subtotal) * Number(discount.value)) / 100;
          if (discount.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, Number(discount.maxDiscountAmount));
          }
        } else {
          discountAmount = Number(discount.value);
        }

        if (discount.minPurchaseAmount && Number(cart.subtotal) < Number(discount.minPurchaseAmount)) {
          discountAmount = 0;
        }

        discountId = discount.id;
      }
    }

    const total = Math.max(0, Number(cart.subtotal) - discountAmount);

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${nanoid(10).toUpperCase()}`,
        photographerId: firstPhoto.photographerId,
        kioskSessionId: cart.kioskSessionId,
        kioskId: cart.kioskSession.kioskId,
        subtotal: cart.subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        discountId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            packageId: item.packageId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            photos: {
              create: item.photos.map((p) => ({
                photoId: p.photoId,
                photoVariantId: p.photoVariantId,
              })),
            },
          })),
        },
        statusHistory: {
          create: {
            status: 'PENDING',
            notes: 'Order created',
          },
        },
      },
      include: {
        items: {
          include: {
            photos: {
              include: {
                photo: true,
              },
            },
          },
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: total,
        paymentMethod,
        idempotencyKey: `${order.id}-${Date.now()}`,
        verifiedByStaffId: paymentMethod === 'CASH' ? staffId : null,
      },
    });

    res.status(201).json(ApiResponseBuilder.success(order, requestId));
  }
);

orderRouter.get('/', authenticateUser, async (req, res) => {
  const requestId = (req as any).id;

  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
          package: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  res.json(ApiResponseBuilder.success(orders, requestId));
});

orderRouter.get('/:id', async (req, res) => {
  const requestId = (req as any).id;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: true,
          package: true,
          photos: {
            include: {
              photo: true,
              photoVariant: true,
            },
          },
        },
      },
      payments: true,
      statusHistory: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      receipt: true,
      digitalGallery: true,
    },
  });

  if (!order) {
    throw new NotFoundError('Order', req.params.id);
  }

  res.json(ApiResponseBuilder.success(order, requestId));
});

orderRouter.patch(
  '/:id/status',
  authenticateUser,
  requireRoles('ADMIN', 'STAFF'),
  validate(z.object({ body: updateOrderStatusSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { status, notes } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            notes,
            changedBy: req.user!.id,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    res.json(ApiResponseBuilder.success(order, requestId));
  }
);
