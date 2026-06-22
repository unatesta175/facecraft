import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, loginSchema, registerPhotographerSchema } from '@facecraft/contracts';
import { authService } from '../services/auth.service';
import { prisma } from '../services/database.service';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(z.object({ body: registerPhotographerSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { email, password, name, phone, businessName } = req.body;

    const result = await authService.register(email, password, name);

    if (phone || businessName) {
      await prisma.photographerProfile.create({
        data: {
          userId: result.user.id,
          phone,
          businessName,
        },
      });
    }

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.status(201).json(
      ApiResponseBuilder.success(
        {
          user: result.user,
          token: result.token,
        },
        requestId
      )
    );
  }
);

authRouter.post('/login', validate(z.object({ body: loginSchema })), async (req, res) => {
  const requestId = (req as any).id;
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  res.json(
    ApiResponseBuilder.success(
      {
        user: result.user,
        token: result.token,
      },
      requestId
    )
  );
});

authRouter.post('/logout', authenticateUser, async (req, res) => {
  const requestId = (req as any).id;

  res.clearCookie('token');

  res.json(
    ApiResponseBuilder.success(
      {
        message: 'Logged out successfully',
      },
      requestId
    )
  );
});

authRouter.get('/me', authenticateUser, async (req, res) => {
  const requestId = (req as any).id;

  const user = await authService.getUserById(req.user!.id);

  res.json(ApiResponseBuilder.success(user, requestId));
});
