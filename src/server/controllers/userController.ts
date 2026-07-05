import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/auth.js';
import { UserModel } from '../models/User.js';
import { logAction } from '../utils/auditLogger.js';

export const userController = {
  /**
   * Retrieve all users.
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await (UserModel as any).find();
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve currently authenticated user profile.
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      res.json(req.user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a user profile.
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Prevent non-admin users from updating other profiles or changing sensitive attributes like role or status
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ error: 'You are not authorized to update this profile.' });
      }

      // Filter sensitive updates if not admin
      if (req.user.role !== 'admin') {
        delete updates.role;
        delete updates.status;
        delete updates.id;
      }

      const updatedUser = await (UserModel as any).findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      await logAction(
        req.user.id,
        'USER_UPDATE',
        `Updated user profile details for user ID: ${id}`,
        req
      );

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle suspension state of a user. (Admin only)
   */
  async toggleSuspension(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { suspend } = req.body;

      if (suspend === undefined) {
        return res.status(400).json({ error: 'suspend parameter (boolean) is required in body.' });
      }

      const newStatus = suspend ? 'suspended' : 'active';
      const updatedUser = await (UserModel as any).findOneAndUpdate(
        { id },
        { $set: { status: newStatus } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      await logAction(
        req.user.id,
        suspend ? 'USER_SUSPEND' : 'USER_ACTIVATE',
        `Changed suspension state for user: ${updatedUser.name} (${updatedUser.email}) to ${newStatus}`,
        req
      );

      res.json({
        message: `User status changed successfully to ${newStatus}`,
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
};
