import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  ComboStatus,
  FrameStatus,
  ObjectStatus,
  ProductStatus,
  ProductType,
  UserRole,
  UserStatus,
  KioskStatus,
} from '@prisma/client';
import { ApiResponseBuilder } from '@facecraft/contracts';
import { prisma } from '../services/database.service';
import { NotFoundError, ValidationError, BusinessRuleError } from '../utils/errors';
import { cleanupReplacedImage, deleteStoredImage } from '../utils/s3-cleanup';
import { toIsoString, toNumber } from '../utils/serialize';

type ComboItemInput = { productId: string; quantity?: number };

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value);
}

function parseStatus<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return value as T;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function syncComboItems(comboProductId: string, items: ComboItemInput[]) {
  await prisma.comboProductItem.deleteMany({ where: { comboProductId } });
  if (items.length === 0) return;

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  if (products.length !== productIds.length) {
    throw new ValidationError('One or more selected products were not found');
  }

  await prisma.comboProductItem.createMany({
    data: items.map((item) => ({
      comboProductId,
      productId: item.productId,
      quantity: Math.max(1, Number(item.quantity) || 1),
    })),
  });
}

async function syncUltraObjectItems(ultraObjectId: string, objectIds: string[]) {
  await prisma.ultraObjectItem.deleteMany({ where: { ultraObjectId } });
  if (objectIds.length === 0) return;

  const uniqueIds = [...new Set(objectIds)];
  const objects = await prisma.objectMaster.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });
  if (objects.length !== uniqueIds.length) {
    throw new ValidationError('One or more selected objects were not found');
  }

  await prisma.ultraObjectItem.createMany({
    data: uniqueIds.map((objectId) => ({ ultraObjectId, objectId })),
  });
}

export function registerAdminCrudRoutes(router: Router) {
  router.post('/sizes', async (req, res) => {
    const requestId = (req as any).id;
    const height = Number(req.body?.height);
    const width = Number(req.body?.width);
    if (!Number.isFinite(height) || !Number.isFinite(width) || height <= 0 || width <= 0) {
      throw new ValidationError('Height and width must be positive numbers');
    }

    const size = await prisma.size.create({ data: { height, width } });
    res.status(201).json(
      ApiResponseBuilder.success(
        { id: size.id, height: toNumber(size.height), width: toNumber(size.width), createdAt: toIsoString(size.createdAt) },
        requestId
      )
    );
  });

  router.patch('/sizes/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.size.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Size', req.params.id);

    const height = req.body?.height !== undefined ? Number(req.body.height) : toNumber(existing.height);
    const width = req.body?.width !== undefined ? Number(req.body.width) : toNumber(existing.width);
    if (!Number.isFinite(height) || !Number.isFinite(width) || height <= 0 || width <= 0) {
      throw new ValidationError('Height and width must be positive numbers');
    }

    const size = await prisma.size.update({ where: { id: req.params.id }, data: { height, width } });
    res.json(
      ApiResponseBuilder.success(
        { id: size.id, height: toNumber(size.height), width: toNumber(size.width), createdAt: toIsoString(size.createdAt) },
        requestId
      )
    );
  });

  router.delete('/sizes/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.size.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Size', req.params.id);

    const linked = await prisma.product.count({ where: { sizeId: req.params.id } });
    if (linked > 0) {
      throw new BusinessRuleError('Cannot delete size while products are linked to it');
    }

    await prisma.size.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/products', async (req, res) => {
    const requestId = (req as any).id;
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw new ValidationError('Product name is required');

    const product = await prisma.product.create({
      data: {
        name,
        price: Number(req.body?.price) || 0,
        description: parseOptionalString(req.body?.description) ?? null,
        productType: parseStatus(req.body?.productType ?? 'OTHERS', Object.values(ProductType), 'product type'),
        photoLimit: Number(req.body?.photoLimit) || 0,
        sizeId: parseOptionalString(req.body?.sizeId) ?? null,
        imageUrl: parseOptionalString(req.body?.imageUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(ProductStatus), 'status'),
      },
      include: { size: true },
    });

    res.status(201).json(ApiResponseBuilder.success({ id: product.id }, requestId));
  });

  router.patch('/products/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Product', req.params.id);

    const nextImageUrl = req.body?.imageUrl !== undefined ? parseOptionalString(req.body.imageUrl) ?? null : undefined;
    if (nextImageUrl !== undefined) {
      await cleanupReplacedImage(existing.imageUrl, nextImageUrl);
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
        ...(req.body?.price !== undefined ? { price: Number(req.body.price) || 0 } : {}),
        ...(req.body?.description !== undefined ? { description: parseOptionalString(req.body.description) ?? null } : {}),
        ...(req.body?.productType !== undefined
          ? { productType: parseStatus(req.body.productType, Object.values(ProductType), 'product type') }
          : {}),
        ...(req.body?.photoLimit !== undefined ? { photoLimit: Number(req.body.photoLimit) || 0 } : {}),
        ...(req.body?.sizeId !== undefined ? { sizeId: parseOptionalString(req.body.sizeId) ?? null } : {}),
        ...(req.body?.imageUrl !== undefined ? { imageUrl: parseOptionalString(req.body.imageUrl) ?? null } : {}),
        ...(req.body?.status !== undefined
          ? { status: parseStatus(req.body.status, Object.values(ProductStatus), 'status') }
          : {}),
      },
    });

    res.json(ApiResponseBuilder.success({ id: product.id }, requestId));
  });

  router.delete('/products/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Product', req.params.id);

    const comboLinks = await prisma.comboProductItem.count({ where: { productId: req.params.id } });
    if (comboLinks > 0) {
      throw new BusinessRuleError('Cannot delete product linked to combo products');
    }

    await deleteStoredImage(existing.imageUrl);
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/combos', async (req, res) => {
    const requestId = (req as any).id;
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw new ValidationError('Combo name is required');

    const items = Array.isArray(req.body?.items) ? (req.body.items as ComboItemInput[]) : [];
    const combo = await prisma.comboProduct.create({
      data: {
        name,
        price: Number(req.body?.price) || 0,
        description: parseOptionalString(req.body?.description) ?? null,
        thumbnailUrl: parseOptionalString(req.body?.thumbnailUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(ComboStatus), 'status'),
      },
    });

    await syncComboItems(combo.id, items);
    res.status(201).json(ApiResponseBuilder.success({ id: combo.id }, requestId));
  });

  router.patch('/combos/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.comboProduct.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Combo product', req.params.id);

    const nextThumbnailUrl =
      req.body?.thumbnailUrl !== undefined ? parseOptionalString(req.body.thumbnailUrl) ?? null : undefined;
    if (nextThumbnailUrl !== undefined) {
      await cleanupReplacedImage(existing.thumbnailUrl, nextThumbnailUrl);
    }

    await prisma.comboProduct.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
        ...(req.body?.price !== undefined ? { price: Number(req.body.price) || 0 } : {}),
        ...(req.body?.description !== undefined ? { description: parseOptionalString(req.body.description) ?? null } : {}),
        ...(req.body?.thumbnailUrl !== undefined ? { thumbnailUrl: parseOptionalString(req.body.thumbnailUrl) ?? null } : {}),
        ...(req.body?.status !== undefined
          ? { status: parseStatus(req.body.status, Object.values(ComboStatus), 'status') }
          : {}),
      },
    });

    if (req.body?.items !== undefined) {
      const items = Array.isArray(req.body.items) ? (req.body.items as ComboItemInput[]) : [];
      await syncComboItems(req.params.id, items);
    }

    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.delete('/combos/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.comboProduct.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Combo product', req.params.id);

    const orderLinks = await prisma.orderCombo.count({ where: { comboProductId: req.params.id } });
    if (orderLinks > 0) {
      throw new BusinessRuleError('Cannot delete combo product linked to existing orders');
    }

    await deleteStoredImage(existing.thumbnailUrl);
    await prisma.comboProduct.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/discounts', async (req, res) => {
    const requestId = (req as any).id;
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    if (!code) throw new ValidationError('Discount code is required');

    const discount = await prisma.discount.create({
      data: {
        code,
        amount: Number(req.body?.amount) || 0,
        description: parseOptionalString(req.body?.description) ?? null,
      },
    });

    res.status(201).json(ApiResponseBuilder.success({ id: discount.id }, requestId));
  });

  router.patch('/discounts/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.discount.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Discount', req.params.id);

    const discount = await prisma.discount.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.code !== undefined ? { code: String(req.body.code).trim().toUpperCase() } : {}),
        ...(req.body?.amount !== undefined ? { amount: Number(req.body.amount) || 0 } : {}),
        ...(req.body?.description !== undefined ? { description: parseOptionalString(req.body.description) ?? null } : {}),
      },
    });

    res.json(ApiResponseBuilder.success({ id: discount.id }, requestId));
  });

  router.delete('/discounts/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.discount.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Discount', req.params.id);

    const orderLinks = await prisma.order.count({ where: { discountId: req.params.id } });
    if (orderLinks > 0) {
      throw new BusinessRuleError('Cannot delete discount used by existing orders');
    }

    await prisma.discount.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/frames', async (req, res) => {
    const requestId = (req as any).id;
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw new ValidationError('Frame name is required');

    const frame = await prisma.frame.create({
      data: {
        name,
        imageUrl: parseOptionalString(req.body?.imageUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(FrameStatus), 'status'),
      },
    });

    res.status(201).json(ApiResponseBuilder.success({ id: frame.id }, requestId));
  });

  router.patch('/frames/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.frame.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Frame', req.params.id);

    const nextImageUrl = req.body?.imageUrl !== undefined ? parseOptionalString(req.body.imageUrl) ?? null : undefined;
    if (nextImageUrl !== undefined) {
      await cleanupReplacedImage(existing.imageUrl, nextImageUrl);
    }

    const frame = await prisma.frame.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
        ...(req.body?.imageUrl !== undefined ? { imageUrl: parseOptionalString(req.body.imageUrl) ?? null } : {}),
        ...(req.body?.status !== undefined
          ? { status: parseStatus(req.body.status, Object.values(FrameStatus), 'status') }
          : {}),
      },
    });

    res.json(ApiResponseBuilder.success({ id: frame.id }, requestId));
  });

  router.delete('/frames/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.frame.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Frame', req.params.id);

    const photoLinks = await prisma.orderPhoto.count({ where: { frameId: req.params.id } });
    if (photoLinks > 0) {
      throw new BusinessRuleError('Cannot delete frame linked to existing order photos');
    }

    await deleteStoredImage(existing.imageUrl);
    await prisma.frame.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/objects', async (req, res) => {
    const requestId = (req as any).id;
    const title = String(req.body?.title ?? '').trim();
    if (!title) throw new ValidationError('Object title is required');

    const obj = await prisma.objectMaster.create({
      data: {
        title,
        description: parseOptionalString(req.body?.description) ?? null,
        imageUrl: parseOptionalString(req.body?.imageUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(ObjectStatus), 'status'),
      },
    });

    res.status(201).json(ApiResponseBuilder.success({ id: obj.id }, requestId));
  });

  router.patch('/objects/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.objectMaster.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Object master', req.params.id);

    const nextImageUrl = req.body?.imageUrl !== undefined ? parseOptionalString(req.body.imageUrl) ?? null : undefined;
    if (nextImageUrl !== undefined) {
      await cleanupReplacedImage(existing.imageUrl, nextImageUrl);
    }

    const obj = await prisma.objectMaster.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.title !== undefined ? { title: String(req.body.title).trim() } : {}),
        ...(req.body?.description !== undefined ? { description: parseOptionalString(req.body.description) ?? null } : {}),
        ...(req.body?.imageUrl !== undefined ? { imageUrl: parseOptionalString(req.body.imageUrl) ?? null } : {}),
        ...(req.body?.status !== undefined
          ? { status: parseStatus(req.body.status, Object.values(ObjectStatus), 'status') }
          : {}),
      },
    });

    res.json(ApiResponseBuilder.success({ id: obj.id }, requestId));
  });

  router.delete('/objects/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.objectMaster.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Object master', req.params.id);

    const ultraLinks = await prisma.ultraObjectItem.count({ where: { objectId: req.params.id } });
    if (ultraLinks > 0) {
      throw new BusinessRuleError('Cannot delete object linked to ultra object sets');
    }

    await deleteStoredImage(existing.imageUrl);
    await prisma.objectMaster.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/ultra-objects', async (req, res) => {
    const requestId = (req as any).id;
    const title = String(req.body?.title ?? '').trim();
    if (!title) throw new ValidationError('Ultra object title is required');

    const objectIds = Array.isArray(req.body?.objectIds) ? (req.body.objectIds as string[]) : [];
    const uo = await prisma.ultraObject.create({
      data: {
        title,
        description: parseOptionalString(req.body?.description) ?? null,
        imageUrl: parseOptionalString(req.body?.imageUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(ObjectStatus), 'status'),
      },
    });

    await syncUltraObjectItems(uo.id, objectIds);
    res.status(201).json(ApiResponseBuilder.success({ id: uo.id }, requestId));
  });

  router.patch('/ultra-objects/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.ultraObject.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Ultra object', req.params.id);

    const nextImageUrl = req.body?.imageUrl !== undefined ? parseOptionalString(req.body.imageUrl) ?? null : undefined;
    if (nextImageUrl !== undefined) {
      await cleanupReplacedImage(existing.imageUrl, nextImageUrl);
    }

    await prisma.ultraObject.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.title !== undefined ? { title: String(req.body.title).trim() } : {}),
        ...(req.body?.description !== undefined ? { description: parseOptionalString(req.body.description) ?? null } : {}),
        ...(req.body?.imageUrl !== undefined ? { imageUrl: parseOptionalString(req.body.imageUrl) ?? null } : {}),
        ...(req.body?.status !== undefined
          ? { status: parseStatus(req.body.status, Object.values(ObjectStatus), 'status') }
          : {}),
      },
    });

    if (req.body?.objectIds !== undefined) {
      const objectIds = Array.isArray(req.body.objectIds) ? (req.body.objectIds as string[]) : [];
      await syncUltraObjectItems(req.params.id, objectIds);
    }

    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.delete('/ultra-objects/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.ultraObject.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Ultra object', req.params.id);

    await deleteStoredImage(existing.imageUrl);
    await prisma.ultraObject.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/users', async (req, res) => {
    const requestId = (req as any).id;
    const name = String(req.body?.name ?? '').trim();
    const username = String(req.body?.username ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    const staffCode = String(req.body?.staffCode ?? username).trim();
    const isPhotographer = Boolean(req.body?.isPhotographer);

    if (!name || !username || !email || !password) {
      throw new ValidationError('Name, username, email, and password are required');
    }

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        staffCode,
        phone: parseOptionalString(req.body?.phone) ?? null,
        locationArea: parseOptionalString(req.body?.locationArea) ?? null,
        role: parseStatus(req.body?.role ?? 'STAFF', Object.values(UserRole), 'role'),
        isPhotographer,
        deletePermission: Boolean(req.body?.deletePermission),
        profileImageUrl: parseOptionalString(req.body?.profileImageUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(UserStatus), 'status'),
        passwordHash: await hashPassword(password),
      },
    });

    res.status(201).json(ApiResponseBuilder.success({ id: user.id }, requestId));
  });

  router.patch('/users/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('User', req.params.id);

    const password = req.body?.password ? String(req.body.password) : '';
    if (password && password !== String(req.body?.confirmPassword ?? password)) {
      throw new ValidationError('Password confirmation does not match');
    }

    const nextProfileImageUrl =
      req.body?.profileImageUrl !== undefined ? parseOptionalString(req.body.profileImageUrl) ?? null : undefined;
    if (nextProfileImageUrl !== undefined) {
      await cleanupReplacedImage(existing.profileImageUrl, nextProfileImageUrl);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
        ...(req.body?.username !== undefined ? { username: String(req.body.username).trim() } : {}),
        ...(req.body?.email !== undefined ? { email: String(req.body.email).trim() } : {}),
        ...(req.body?.staffCode !== undefined ? { staffCode: String(req.body.staffCode).trim() } : {}),
        ...(req.body?.phone !== undefined ? { phone: parseOptionalString(req.body.phone) ?? null } : {}),
        ...(req.body?.locationArea !== undefined ? { locationArea: parseOptionalString(req.body.locationArea) ?? null } : {}),
        ...(req.body?.role !== undefined ? { role: parseStatus(req.body.role, Object.values(UserRole), 'role') } : {}),
        ...(req.body?.isPhotographer !== undefined ? { isPhotographer: Boolean(req.body.isPhotographer) } : {}),
        ...(req.body?.deletePermission !== undefined ? { deletePermission: Boolean(req.body.deletePermission) } : {}),
        ...(req.body?.profileImageUrl !== undefined ? { profileImageUrl: parseOptionalString(req.body.profileImageUrl) ?? null } : {}),
        ...(req.body?.status !== undefined ? { status: parseStatus(req.body.status, Object.values(UserStatus), 'status') } : {}),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });

    res.json(ApiResponseBuilder.success({ id: user.id }, requestId));
  });

  router.delete('/users/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('User', req.params.id);

    const [orderLinks, orderPhotoLinks, photographerPhotoLinks] = await Promise.all([
      prisma.order.count({ where: { staffId: req.params.id } }),
      prisma.orderPhoto.count({ where: { photographerId: req.params.id } }),
      prisma.photographerPhoto.count({ where: { photographerId: req.params.id } }),
    ]);
    if (orderLinks > 0 || orderPhotoLinks > 0 || photographerPhotoLinks > 0) {
      throw new BusinessRuleError('Cannot delete user linked to existing orders or photos');
    }

    await deleteStoredImage(existing.profileImageUrl);
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });

  router.post('/kiosks', async (req, res) => {
    const requestId = (req as any).id;
    const name = String(req.body?.name ?? '').trim();
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!name || !username || !password) {
      throw new ValidationError('Name, username, and password are required');
    }

    const kiosk = await prisma.kiosk.create({
      data: {
        name,
        username,
        description: parseOptionalString(req.body?.description) ?? null,
        profileImageUrl: parseOptionalString(req.body?.profileImageUrl) ?? null,
        status: parseStatus(req.body?.status ?? 'ACTIVE', Object.values(KioskStatus), 'status'),
        passwordHash: await hashPassword(password),
      },
    });

    res.status(201).json(ApiResponseBuilder.success({ id: kiosk.id }, requestId));
  });

  router.patch('/kiosks/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.kiosk.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Kiosk', req.params.id);

    const password = req.body?.password ? String(req.body.password) : '';
    if (password && password !== String(req.body?.confirmPassword ?? password)) {
      throw new ValidationError('Password confirmation does not match');
    }

    const nextProfileImageUrl =
      req.body?.profileImageUrl !== undefined ? parseOptionalString(req.body.profileImageUrl) ?? null : undefined;
    if (nextProfileImageUrl !== undefined) {
      await cleanupReplacedImage(existing.profileImageUrl, nextProfileImageUrl);
    }

    const kiosk = await prisma.kiosk.update({
      where: { id: req.params.id },
      data: {
        ...(req.body?.name !== undefined ? { name: String(req.body.name).trim() } : {}),
        ...(req.body?.username !== undefined ? { username: String(req.body.username).trim() } : {}),
        ...(req.body?.description !== undefined ? { description: parseOptionalString(req.body.description) ?? null } : {}),
        ...(req.body?.profileImageUrl !== undefined ? { profileImageUrl: parseOptionalString(req.body.profileImageUrl) ?? null } : {}),
        ...(req.body?.status !== undefined ? { status: parseStatus(req.body.status, Object.values(KioskStatus), 'status') } : {}),
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });

    res.json(ApiResponseBuilder.success({ id: kiosk.id }, requestId));
  });

  router.delete('/kiosks/:id', async (req, res) => {
    const requestId = (req as any).id;
    const existing = await prisma.kiosk.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Kiosk', req.params.id);

    const orderLinks = await prisma.order.count({ where: { kioskId: req.params.id } });
    if (orderLinks > 0) {
      throw new BusinessRuleError('Cannot delete kiosk linked to existing orders');
    }

    await deleteStoredImage(existing.profileImageUrl);
    await prisma.kiosk.delete({ where: { id: req.params.id } });
    res.json(ApiResponseBuilder.success({ id: req.params.id }, requestId));
  });
}
