import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError, ConflictError } from '../utils/errors';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string, name: string, roleName: string = 'PHOTOGRAPHER') {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    logger.info({ userId: user.id, email, role: roleName }, 'User registered');

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((ur: any) => ur.role.name),
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    logger.info({ userId: user.id, email }, 'User logged in');

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((ur: any) => ur.role.name),
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        photographerProfile: true,
        staffProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.name),
      permissions: user.roles.flatMap((ur: any) =>
        ur.role.permissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
      ),
      photographerProfile: user.photographerProfile,
      staffProfile: user.staffProfile,
    };
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, env.SESSION_SECRET, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, env.SESSION_SECRET) as { userId: string };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
