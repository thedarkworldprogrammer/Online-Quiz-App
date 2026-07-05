import express from 'express';
import { dbService } from '../services/dbService';
import { getActiveUserId } from '../utils/session';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const userId = getActiveUserId(req);
    const users = await dbService.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const logs = await dbService.getAuditLogs();
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
