import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError, ConflictError } from '../utils/errors';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string, name: string, username: string, staffCode: string, role: string = 'STAFF') {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        username,
        staffCode,
        role: role as any,
      },
    });

    logger.info({ userId: user.id, email, role }, 'User registered');

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        staffCode: user.staffCode,
        role: user.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

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
        username: user.username,
        staffCode: user.staffCode,
        role: user.role,
        isPhotographer: user.isPhotographer,
      },
      token,
    };
  }

  async loginByUsername(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AuthenticationError('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid username or password');
    }

    logger.info({ userId: user.id, username }, 'User logged in');

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        staffCode: user.staffCode,
        role: user.role,
        isPhotographer: user.isPhotographer,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      staffCode: user.staffCode,
      role: user.role,
      status: user.status,
      deletePermission: user.deletePermission,
      isPhotographer: user.isPhotographer,
      profileImageUrl: user.profileImageUrl,
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
