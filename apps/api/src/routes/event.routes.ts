import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, createEventSchema } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

export const eventRouter = Router();

eventRouter.use(authenticateUser);

eventRouter.get('/', async (req, res) => {
  const requestId = (req as any).id;
  const user = req.user!;

  const where: any = {};

  if (user.roles.includes('PHOTOGRAPHER')) {
    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: user.id },
    });
    if (profile) {
      where.photographerId = profile.id;
    }
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      photographer: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          photos: true,
        },
      },
    },
    orderBy: {
      eventDate: 'desc',
    },
  });

  res.json(
    ApiResponseBuilder.success(
      events.map((e: any) => ({
        ...e,
        photoCount: e._count.photos,
      })),
      requestId
    )
  );
});

eventRouter.post(
  '/',
  requireRoles('PHOTOGRAPHER', 'ADMIN'),
  validate(z.object({ body: createEventSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const user = req.user!;

    const profile = await prisma.photographerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new NotFoundError('Photographer profile');
    }

    const event = await prisma.event.create({
      data: {
        photographerId: profile.id,
        name: req.body.name,
        description: req.body.description,
        eventDate: new Date(req.body.eventDate),
        location: req.body.location,
      },
    });

    res.status(201).json(ApiResponseBuilder.success(event, requestId));
  }
);

eventRouter.get('/:id', async (req, res) => {
  const requestId = (req as any).id;

  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      photographer: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          photos: true,
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Event', req.params.id);
  }

  res.json(ApiResponseBuilder.success(event, requestId));
});

eventRouter.patch('/:id', requireRoles('PHOTOGRAPHER', 'ADMIN'), async (req, res) => {
  const requestId = (req as any).id;

  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json(ApiResponseBuilder.success(event, requestId));
});
