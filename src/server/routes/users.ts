import express from 'express';
import { userController } from '../controllers/userController.js';
import { authMiddleware, requireRole } from '../utils/auth.js';

const router = express.Router();

// Apply authentication to all user management endpoints
router.use(authMiddleware as any);

// Retrieve all users (restricted to teachers and admins)
router.get('/', requireRole(['teacher', 'admin']) as any, userController.getAllUsers);

// Retrieve or update profile
router.get('/profile', userController.getProfile);
router.put('/:id', userController.updateProfile);

// Toggle suspension state (restricted to admins only)
router.post('/:id/suspend', requireRole(['admin']) as any, userController.toggleSuspension);

export default router;
