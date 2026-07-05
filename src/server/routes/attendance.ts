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
    res.json(newAtt);
  } catch (error) {
    next(error);
  }
});

export default router;
