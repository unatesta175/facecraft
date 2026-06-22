import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, createPackageSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

export const packageRouter = Router();

packageRouter.get('/', async (req, res) => {
  const requestId = (req as any).id;
  const { isActive } = req.query;

  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const packages = await prisma.package.findMany({
    where,
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.json(ApiResponseBuilder.success(packages, requestId));
});

packageRouter.post(
  '/',
  authenticateUser,
  requireRoles('ADMIN'),
  validate(z.object({ body: createPackageSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { items, ...packageData } = req.body;

    const pkg = await prisma.package.create({
      data: {
        ...packageData,
        items: {
          create: items,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json(ApiResponseBuilder.success(pkg, requestId));
  }
);

packageRouter.get('/:id', async (req, res) => {
  const requestId = (req as any).id;

  const pkg = await prisma.package.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!pkg) {
    throw new NotFoundError('Package', req.params.id);
  }

  res.json(ApiResponseBuilder.success(pkg, requestId));
});

packageRouter.patch('/:id', authenticateUser, requireRoles('ADMIN'), async (req, res) => {
  const requestId = (req as any).id;

  const pkg = await prisma.package.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res.json(ApiResponseBuilder.success(pkg, requestId));
});
