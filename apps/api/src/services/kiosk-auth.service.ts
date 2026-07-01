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
    const showPasswordHint = process.env.SHOW_DEMO_CREDENTIALS !== 'false';
    const passwordHint = showPasswordHint ? 'password123' : undefined;

    const adminByEmail = await prisma.user.findFirst({
      where: { email: 'admin@facecraft.com', status: 'ACTIVE' },
      select: { name: true, email: true, username: true, role: true },
    });
    const admin =
      adminByEmail ??
      (await prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        orderBy: { createdAt: 'asc' },
        select: { name: true, email: true, username: true, role: true },
      }));

    const kioskByUsername = await prisma.kiosk.findFirst({
      where: { username: 'kiosk01', status: 'ACTIVE' },
      select: { name: true, username: true, description: true },
    });
    const kiosk =
      kioskByUsername ??
      (await prisma.kiosk.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        select: { name: true, username: true, description: true },
      }));

    const photographerByUsername = await prisma.user.findFirst({
      where: { username: 'haris.farhan', status: 'ACTIVE' },
      select: { name: true, email: true, username: true, role: true },
    });
    const photographer =
      photographerByUsername ??
      (await prisma.user.findFirst({
        where: { status: 'ACTIVE', isPhotographer: true },
        orderBy: { createdAt: 'asc' },
        select: { name: true, email: true, username: true, role: true },
      }));

    const fallbackAdmin = {
      name: 'Ahmad Razif',
      email: 'admin@facecraft.com',
      username: 'ahmad.razif',
      role: 'ADMIN',
    };
    const fallbackKiosk = {
      name: 'Main Lobby Kiosk',
      username: 'kiosk01',
      description: 'Primary kiosk at main lobby',
    };
    const fallbackPhotographer = {
      name: 'Haris Farhan',
      email: 'photographer@facecraft.com',
      username: 'haris.farhan',
      role: 'STAFF',
    };

    return {
      admin: admin ?? fallbackAdmin,
      kiosk: kiosk ?? fallbackKiosk,
      photographer: photographer ?? fallbackPhotographer,
      passwordHint,
    };
  }
}

export const kioskAuthService = new KioskAuthService();
