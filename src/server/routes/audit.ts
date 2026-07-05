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

router.delete('/bulk', async (req, res, next) => {
  try {
    const userId = getActiveUserId(req);
    const users = await dbService.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Log IDs array required' });
    }

    await dbService.deleteAuditLogs(ids);

    // Track this action by creating an audit log of the deletion itself
    await dbService.addAuditLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: 'admin',
      action: 'SYSTEM_AUDIT_DELETE',
      details: `Bulk deleted ${ids.length} audit trail log entries`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    next(error);
  }
});

export default router;
