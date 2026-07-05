import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.js';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.js';
import { logAction } from '../utils/auditLogger.js';
import { setCurrentUserId } from '../utils/session.js';
import { User } from '../../types.js';

export const authController = {
  /**
   * Register a new user with standard credentials.
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required.' });
      }

      if (!['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be student, teacher, or admin.' });
      }

      const existingUser = await (UserModel as any).findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }

      const passwordHash = await hashPassword(password);
      const id = `usr-${role}-${Date.now()}`;

      const newUserDoc = new UserModel({
        id,
        name,
        email: email.toLowerCase(),
        role,
        status: 'active',
        passwordHash,
        avatar: `https://images.unsplash.com/photo-${role === 'teacher' ? '1494790108377-be9c29b29330' : '1539571696357-5a69c17a67c6'}?auto=format&fit=crop&w=150&q=80`,
        academicDetails: role === 'student' ? {
          batch: 'A',
          semester: '4th Semester',
          rollNo: `CS-2026-${Math.floor(Math.random() * 1000)}`,
          xp: 100,
          level: 1,
          streak: 1
        } : undefined
      });

      await newUserDoc.save();

      const user: User = newUserDoc.toObject({ virtuals: true }) as any;
      const token = generateToken(user);

      // Log the registration audit action
      setCurrentUserId(id);
      await logAction(id, 'USER_REGISTER', `Successfully registered standard account: ${name} (${role})`, req);

      res.status(201).json({
        message: 'Registration successful',
        user,
        token
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Traditional password-based login.
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const userDoc = await (UserModel as any).findOne({ email: email.toLowerCase() });
      if (!userDoc) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (userDoc.status === 'suspended') {
        return res.status(403).json({ error: 'Your account is suspended. Please contact administration.' });
      }

      // If user was created via seed/dev login with empty passwordHash, let them pass if they enter any password,
      // or check the hash.
      if (userDoc.passwordHash) {
        const isMatch = await comparePassword(password, userDoc.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password.' });
        }
      }

      const user: User = userDoc.toObject({ virtuals: true }) as any;
      const token = generateToken(user);

      setCurrentUserId(user.id);
      await logAction(user.id, 'USER_LOGIN', `Standard login successful for ${user.name}`, req);

      res.json({
        message: 'Login successful',
        user,
        token
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Send simulated One-Time Password (OTP) code.
   */
  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required for OTP login.' });
      }

      let userDoc = await (UserModel as any).findOne({ email: email.toLowerCase() });
      if (!userDoc) {
        return res.status(404).json({ error: 'No user account found with this email address.' });
      }

      if (userDoc.status === 'suspended') {
        return res.status(403).json({ error: 'This user account is suspended.' });
      }

      // Generate a 6-digit numeric OTP code
      const otpCode = Math.floor(100000 + Math.random() * 90000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

      userDoc.otpCode = otpCode;
      userDoc.otpExpires = otpExpires;
      await userDoc.save();

      // Log OTP code to server console for developer convenience and transparency
      console.log(`\n🔑 [OTP SECURITY] Generated login code for ${email}: ${otpCode} (Expires: ${otpExpires.toISOString()})\n`);

      await logAction(
        userDoc.id,
        'OTP_REQUEST',
        `Simulated OTP login code generated and sent to console for user email: ${email}`,
        req
      );

      res.json({
        message: 'A 6-digit verification code has been generated. For testing/demo purposes, find the code logged inside the server logs console.',
        email
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify the OTP code and return JWT.
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required.' });
      }

      const userDoc = await (UserModel as any).findOne({ email: email.toLowerCase() });
      if (!userDoc) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (!userDoc.otpCode || !userDoc.otpExpires) {
        return res.status(400).json({ error: 'No active OTP verification session found for this email.' });
      }

      if (new Date() > userDoc.otpExpires) {
        return res.status(400).json({ error: 'The verification code has expired. Please request a new code.' });
      }

      if (userDoc.otpCode !== code) {
        return res.status(400).json({ error: 'Incorrect verification code.' });
      }

      // Clear the code after successful verification
      userDoc.otpCode = undefined;
      userDoc.otpExpires = undefined;
      await userDoc.save();

      const user: User = userDoc.toObject({ virtuals: true }) as any;
      const token = generateToken(user);

      setCurrentUserId(user.id);
      await logAction(user.id, 'OTP_VERIFY_SUCCESS', `Successfully authenticated via OTP verification code`, req);

      res.json({
        message: 'OTP authentication successful',
        user,
        token
      });
    } catch (error) {
      next(error);
    }
  }
};
