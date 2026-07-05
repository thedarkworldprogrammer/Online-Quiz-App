import express from 'express';
import { dbService } from '../services/dbService';

export async function logAction(
  userId: string | null,
  action: string,
  details: string,
  req?: express.Request
) {
  try {
    const users = await dbService.getUsers();
    const user = userId ? users.find(u => u.id === userId) : null;
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string || req.ip || '127.0.0.1')
      : '127.0.0.1';

    if (user) {
      await dbService.addAuditLog({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action,
        details,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    } else {
      await dbService.addAuditLog({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: userId || 'usr-anonymous',
        userName: 'Anonymous User',
        userEmail: 'anonymous@eduassess.ai',
        userRole: 'student',
        action,
        details,
        ipAddress,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
