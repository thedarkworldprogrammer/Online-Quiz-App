import express from 'express';
import { dbService } from '../services/dbService';
import { getActiveUserId } from '../utils/session';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const userId = getActiveUserId(req);
    const notifications = await dbService.getNotifications();
    const filtered = notifications.filter(n => n.userId === userId);
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.post('/read', async (req, res, next) => {
  try {
    const userId = getActiveUserId(req);
    await dbService.markNotificationsRead(userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
