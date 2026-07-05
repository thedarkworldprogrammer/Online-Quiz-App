import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../types.js';
import { UserModel } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'eduassess-super-secret-production-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Generate a secure JWT for a user.
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Hash a plain text password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * JWT Authentication Middleware.
 * Decodes the JWT token and fetches the user from the database.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing from authorization header' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return res.status(401).json({ error: `Invalid or expired token: ${err.message}` });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Try finding the user in MongoDB
    let userDoc = await (UserModel as any).findOne({ id: decoded.id });
    if (!userDoc) {
      return res.status(401).json({ error: 'Authenticated user no longer exists' });
    }

    if (userDoc.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    // Convert document to clean user object
    const user: User = userDoc.toObject({ virtuals: true }) as any;
    if ((user as any)._id) {
      user.id = user.id || (user as any)._id.toString();
      delete (user as any)._id;
    }
    delete (user as any).__v;
    delete (user as any).passwordHash;
    delete (user as any).otpCode;
    delete (user as any).otpExpires;

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization Middleware.
 * Restricts access to specific user roles.
 */
export function requireRole(roles: ('admin' | 'teacher' | 'student')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to roles [${roles.join(', ')}]. Your role is ${req.user.role}.`
      });
    }

    next();
  };
}
