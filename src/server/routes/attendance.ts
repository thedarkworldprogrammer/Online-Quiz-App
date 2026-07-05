import express from 'express';
import { dbService } from '../services/dbService';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const attendance = await dbService.getAttendance();
    res.json(attendance);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { studentId, courseId, status, date } = req.body;
    const newAtt = await dbService.addAttendance({
      id: `att-manual-${Date.now()}`,
      studentId,
      courseId,
      status,
      date: date || new Date().toISOString().split('T')[0]
    });

    try {
      // Find user details to add to audit log
      const users = await dbService.getUsers();
      const student = users.find(u => u.id === studentId);
      if (student) {
        await dbService.addAuditLog({
          id: `log-att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: student.id,
          userName: student.name,
          userEmail: student.email,
          userRole: student.role,
          action: 'ATTENDANCE_CONFIRM',
          details: `Self-confirmed attendance for course ${courseId} as ${status} on ${newAtt.date}`,
          ipAddress: req.ip || '127.0.0.1',
          timestamp: new Date().toISOString()
        });
      }
    } catch (auditError) {
      console.error("Failed to write attendance audit log:", auditError);
    }

    res.json(newAtt);
  } catch (error) {
    next(error);
  }
});

export default router;
