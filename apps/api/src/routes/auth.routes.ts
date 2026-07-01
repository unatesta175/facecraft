import { Router } from 'express';
import { z } from 'zod';
import { ApiResponseBuilder, loginSchema, registerPhotographerSchema, usernameLoginSchema, kioskLoginSchema } from '@facecraft/contracts';
import { authService } from '../services/auth.service';
import { kioskAuthService } from '../services/kiosk-auth.service';
import { prisma } from '../services/database.service';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { resolveImageUrl } from '../utils/image-url';
import { getAuthCookieOptions } from '../utils/cookie-options';
import { NotFoundError } from '../utils/errors';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate(z.object({ body: registerPhotographerSchema })),
  async (req, res) => {
    const requestId = (req as any).id;
    const { email, password, name } = req.body;

    const result = await authService.register(
      email,
      password,
      name,
      email.split('@')[0],
      `FC-${Date.now()}`,
      'STAFF'
    );

    await prisma.user.update({
      where: { id: result.user.id },
      data: { isPhotographer: true },
    });

    res.cookie('token', result.token, getAuthCookieOptions());

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

  res.cookie('token', result.token, getAuthCookieOptions());

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

authRouter.post('/login-username', validate(z.object({ body: usernameLoginSchema })), async (req, res) => {
  const requestId = (req as any).id;
  const { username, password } = req.body;

  const result = await authService.loginByUsername(username, password);

  res.cookie('token', result.token, getAuthCookieOptions());

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

authRouter.get('/demo-accounts', async (req, res) => {
  const requestId = (req as any).id;
  const accounts = await kioskAuthService.getDemoAccounts();
  res.json(ApiResponseBuilder.success(accounts, requestId));
});

authRouter.post('/kiosk-login', validate(z.object({ body: kioskLoginSchema })), async (req, res) => {
  const requestId = (req as any).id;
  const { username, password } = req.body;

  const result = await kioskAuthService.login(username, password);

  res.cookie('kioskToken', result.token, getAuthCookieOptions());

  res.json(
    ApiResponseBuilder.success(
      {
        kiosk: result.kiosk,
        token: result.token,
      },
      requestId
    )
  );
});

authRouter.post('/kiosk-logout', async (req, res) => {
  const requestId = (req as any).id;
  res.clearCookie('kioskToken', getAuthCookieOptions());
  res.json(ApiResponseBuilder.success({ message: 'Logged out successfully' }, requestId));
});

authRouter.post('/logout', authenticateUser, async (req, res) => {
  const requestId = (req as any).id;

  res.clearCookie('token', getAuthCookieOptions());

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

  if (!user) {
    throw new NotFoundError('User', req.user!.id);
  }

  res.json(
    ApiResponseBuilder.success(
      {
        ...user,
        profileImageUrl: await resolveImageUrl(user.profileImageUrl),
      },
      requestId
    )
  );
});
