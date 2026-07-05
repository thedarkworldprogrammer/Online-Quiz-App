import express from 'express';
import { dbService } from '../services/dbService';
import { getPersonalizedStudyPlan } from '../gemini.js';
import { getActiveUserId } from '../utils/session';

const router = express.Router();

router.get('/recommendations', async (req, res, next) => {
  try {
    const userId = getActiveUserId(req);
    const users = await dbService.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const attempts = await dbService.getAttempts();
    const studentAttempts = attempts.filter(a => a.studentId === userId);

    const courses = await dbService.getCourses();
    const subjects = courses.flatMap(c => c.subjects);

    const plan = await getPersonalizedStudyPlan(user.name, studentAttempts, subjects);
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

export default router;
