import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, createDiscountSchema, applyDiscountSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

export const discountRouter = Router();

discountRouter.post(
  '/validate',
  validate(z.object({ body: applyDiscountSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { code } = req.body;

    const discount = await prisma.discount.findUnique({
      where: { code, isActive: true },
    });

    if (!discount) {
      throw new NotFoundError('Discount code', code);
    }

    const now = new Date();
    if (discount.startDate > now || discount.endDate < now) {
      throw new BusinessRuleError('Discount code has expired or is not yet valid');
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      throw new BusinessRuleError('Discount code has reached its usage limit');
    }

    res.json(
      ApiResponseBuilder.success(
        {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          minPurchaseAmount: discount.minPurchaseAmount,
          maxDiscountAmount: discount.maxDiscountAmount,
        },
        requestId
      )
    );
  }
);

discountRouter.get('/', authenticateUser, requireRoles('ADMIN'), async (req, res) => {
  const requestId = (req as any).id;

  const discounts = await prisma.discount.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(ApiResponseBuilder.success(discounts, requestId));
});

discountRouter.post(
  '/',
  authenticateUser,
  requireRoles('ADMIN'),
  validate(z.object({ body: createDiscountSchema })),
  async (req, res) => {
    const requestId = (req as any).id;

    const discount = await prisma.discount.create({
      data: {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      },
    });

    res.status(201).json(ApiResponseBuilder.success(discount, requestId));
  }
);

discountRouter.get('/:id', authenticateUser, requireRoles('ADMIN'), async (req, res) => {
  const requestId = (req as any).id;

  const discount = await prisma.discount.findUnique({
    where: { id: req.params.id },
    include: {
      redemptions: {
        include: {
          order: true,
        },
      },
    },
  });

  if (!discount) {
    throw new NotFoundError('Discount', req.params.id);
  }

  res.json(ApiResponseBuilder.success(discount, requestId));
});
