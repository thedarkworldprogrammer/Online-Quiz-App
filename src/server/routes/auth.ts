import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../utils/auth.js';

const router = express.Router();

// Public Authentication endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/otp/request', authController.requestOtp);
router.post('/otp/verify', authController.verifyOtp);

// Protected Authentication endpoints
router.get('/me', authMiddleware as any, (req: any, res) => {
  res.json(req.user);
});

export default router;
