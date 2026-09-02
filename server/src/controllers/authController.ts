import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { generateToken } from '../middleware/auth';
import { UserRole } from '../types';
import { auditService } from '../services/auditService';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerFarmerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  fullName: z.string().min(2),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
  preferredLanguage: z.enum(['en', 'hi', 'pb']).default('en'),
  address: z.string().min(3),
  district: z.string().min(2),
  village: z.string().min(2),
  landDetails: z.object({
    acreage: z.number().positive(),
    surveyNumber: z.string(),
    irrigationType: z.string(),
  }),
  bankName: z.string().min(2),
  accountNumber: z.string().min(8),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Valid IFSC code required'),
  preferredProcurementCentre: z.string().optional(),
});

export const authController = {
  async login(req: Request, res: Response) {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { mobileNumber: username }],
      },
      include: { farmer: true, centre: true },
    });

    if (!user) {
      return sendError(res, 'Invalid credentials provided.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials provided.', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      centreId: user.centreId,
      farmerId: user.farmerId,
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        mobileNumber: user.mobileNumber,
        centreId: user.centreId,
        farmerId: user.farmerId,
        centre: user.centre,
        farmer: user.farmer,
      },
    }, 'Login successful');
  },

  async registerFarmer(req: Request, res: Response) {
    const data = registerFarmerSchema.parse(req.body);

    // Check duplicates
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { mobileNumber: data.mobileNumber }],
      },
    });

    if (existingUser) {
      return sendError(res, 'A user or farmer with this username or mobile number already exists.', 409, 'DUPLICATE_USER');
    }

    const existingFarmer = await prisma.farmer.findFirst({
      where: { mobileNumber: data.mobileNumber },
    });

    if (existingFarmer) {
      return sendError(res, 'A farmer profile is already registered with this mobile number.', 409, 'DUPLICATE_FARMER');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const farmerId = `FARMER-${data.district.slice(0, 2).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const maskedAccount = `XXXXXXXX${data.accountNumber.slice(-4)}`;

    const result = await prisma.$transaction(async (tx) => {
      const farmer = await tx.farmer.create({
        data: {
          farmerId,
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          preferredLanguage: data.preferredLanguage,
          address: data.address,
          district: data.district,
          village: data.village,
          landDetails: JSON.stringify(data.landDetails),
          bankName: data.bankName,
          accountNumberMasked: maskedAccount,
          ifscCode: data.ifscCode,
          preferredProcurementCentre: data.preferredProcurementCentre,
        },
      });

      const user = await tx.user.create({
        data: {
          username: data.username,
          passwordHash: hashedPassword,
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          role: UserRole.FARMER,
          farmerId: farmer.farmerId,
        },
      });

      return { user, farmer };
    });

    await auditService.log({
      actor: result.farmer.fullName,
      actorRole: 'FARMER',
      action: 'FARMER_REGISTRATION',
      entityType: 'Farmer',
      entityId: result.farmer.id,
      newValue: { farmerId: result.farmer.farmerId, mobile: data.mobileNumber },
      reason: 'Direct portal farmer registration',
    });

    const token = generateToken({
      id: result.user.id,
      username: result.user.username,
      fullName: result.user.fullName,
      role: UserRole.FARMER,
      farmerId: result.farmer.farmerId,
    });

    return sendSuccess(res, {
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
        fullName: result.user.fullName,
        role: result.user.role,
        farmerId: result.farmer.farmerId,
        farmer: result.farmer,
      },
    }, 'Farmer registered successfully', 201);
  },

  async getCurrentUser(req: Request, res: Response) {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        farmer: true,
        centre: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      mobileNumber: user.mobileNumber,
      centreId: user.centreId,
      farmerId: user.farmerId,
      centre: user.centre,
      farmer: user.farmer,
    });
  },

  // Role Switcher / Demo helper for rapid review of all 6 roles
  async switchRole(req: Request, res: Response) {
    const { targetRole, centreId } = req.body;

    const user = await prisma.user.findFirst({
      where: { role: targetRole },
      include: { farmer: true, centre: true },
    });

    if (!user) {
      return sendError(res, `Demo account for role ${targetRole} not found. Run seed script.`, 404, 'NOT_FOUND');
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role as UserRole,
      centreId: centreId || user.centreId,
      farmerId: user.farmerId,
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        mobileNumber: user.mobileNumber,
        centreId: centreId || user.centreId,
        farmerId: user.farmerId,
        centre: user.centre,
        farmer: user.farmer,
      },
    }, `Switched to role ${targetRole}`);
  },
};
