import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './database.service';
import { env } from '../config/env';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../config/logger';

export class KioskAuthService {
  async login(username: string, password: string) {
    const kiosk = await prisma.kiosk.findUnique({
      where: { username },
    });

    if (!kiosk || kiosk.status !== 'ACTIVE') {
      throw new AuthenticationError('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, kiosk.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid username or password');
    }

    logger.info({ kioskId: kiosk.id, username }, 'Kiosk logged in');

    const token = this.generateToken(kiosk.id);

    return {
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        username: kiosk.username,
        description: kiosk.description,
        status: kiosk.status,
      },
      token,
    };
  }

  generateToken(kioskId: string): string {
    return jwt.sign({ kioskId, type: 'kiosk' }, env.SESSION_SECRET, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): { kioskId: string } {
    try {
      const decoded = jwt.verify(token, env.SESSION_SECRET) as {
        kioskId?: string;
        type?: string;
      };

      if (!decoded.kioskId || decoded.type !== 'kiosk') {
        throw new AuthenticationError('Invalid kiosk token');
      }

      return { kioskId: decoded.kioskId };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Invalid or expired kiosk token');
    }
  }

  async getDemoAccounts() {
    const [admin, kiosk] = await Promise.all([
      prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          name: true,
          email: true,
          username: true,
          role: true,
        },
      }),
      prisma.kiosk.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        select: {
          name: true,
          username: true,
          description: true,
        },
      }),
    ]);

    return {
      admin: admin
        ? {
            name: admin.name,
            email: admin.email,
            username: admin.username,
            role: admin.role,
          }
        : null,
      kiosk: kiosk
        ? {
            name: kiosk.name,
            username: kiosk.username,
            description: kiosk.description,
          }
        : null,
      passwordHint:
        process.env.SHOW_DEMO_CREDENTIALS === 'false' ? undefined : 'password123',
    };
  }
}

export const kioskAuthService = new KioskAuthService();
