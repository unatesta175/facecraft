import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, createProductSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

export const productRouter = Router();

productRouter.get('/', async (req, res) => {
  const requestId = (req as any).id;
  const { categoryId, type, isActive } = req.query;

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.json(ApiResponseBuilder.success(products, requestId));
});

productRouter.post(
  '/',
  authenticateUser,
  requireRoles('ADMIN'),
  validate(z.object({ body: createProductSchema })),
  async (req, res) => {
    const requestId = (req as any).id;

    const product = await prisma.product.create({
      data: req.body,
      include: {
        category: true,
      },
    });

    res.status(201).json(ApiResponseBuilder.success(product, requestId));
  }
);

productRouter.get('/:id', async (req, res) => {
  const requestId = (req as any).id;

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      variants: true,
    },
  });

  if (!product) {
    throw new NotFoundError('Product', req.params.id);
  }

  res.json(ApiResponseBuilder.success(product, requestId));
});

productRouter.patch('/:id', authenticateUser, requireRoles('ADMIN'), async (req, res) => {
  const requestId = (req as any).id;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      category: true,
      variants: true,
    },
  });

  res.json(ApiResponseBuilder.success(product, requestId));
});
