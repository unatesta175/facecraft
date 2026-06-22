import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, addToCartSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { validate } from '../middleware/validate';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

export const cartRouter = Router();

cartRouter.post('/', async (req, res) => {
  const requestId = (req as any).id;
  const { kioskSessionId } = req.body;

  const session = await prisma.kioskSession.findUnique({
    where: { id: kioskSessionId },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new NotFoundError('Valid kiosk session');
  }

  const cart = await prisma.cart.create({
    data: {
      kioskSessionId,
    },
  });

  res.status(201).json(ApiResponseBuilder.success(cart, requestId));
});

cartRouter.get('/:id', async (req, res) => {
  const requestId = (req as any).id;

  const cart = await prisma.cart.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: true,
          package: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          photos: {
            include: {
              photo: true,
              photoVariant: true,
            },
          },
        },
      },
      appliedDiscount: true,
    },
  });

  if (!cart) {
    throw new NotFoundError('Cart', req.params.id);
  }

  res.json(ApiResponseBuilder.success(cart, requestId));
});

cartRouter.post(
  '/:id/items',
  validate(z.object({ body: addToCartSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { productId, packageId, quantity, photos } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { id: req.params.id },
    });

    if (!cart) {
      throw new NotFoundError('Cart', req.params.id);
    }

    let unitPrice = 0;

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundError('Product', productId);
      }
      unitPrice = Number(product.basePrice);
    } else if (packageId) {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId },
        include: {
          items: true,
        },
      });
      if (!pkg) {
        throw new NotFoundError('Package', packageId);
      }

      const totalRequiredPhotos = pkg.items.reduce(
        (sum, item) => sum + item.requiredPhotoCount * item.quantity,
        0
      );

      if (photos.length < totalRequiredPhotos) {
        throw new BusinessRuleError(
          `Package requires ${totalRequiredPhotos} photos, but only ${photos.length} provided`
        );
      }

      unitPrice = Number(pkg.basePrice);
    }

    const subtotal = unitPrice * quantity;

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        packageId,
        quantity,
        unitPrice,
        subtotal,
        photos: {
          create: photos.map((p) => ({
            photoId: p.photoId,
            photoVariantId: p.photoVariantId,
          })),
        },
      },
      include: {
        photos: {
          include: {
            photo: true,
            photoVariant: true,
          },
        },
      },
    });

    const updatedSubtotal = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { subtotal: true },
    });

    const newSubtotal = Number(updatedSubtotal._sum.subtotal || 0);
    const discount = Number(cart.discount);
    const newTotal = Math.max(0, newSubtotal - discount);

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        subtotal: newSubtotal,
        total: newTotal,
      },
    });

    res.status(201).json(ApiResponseBuilder.success(cartItem, requestId));
  }
);
