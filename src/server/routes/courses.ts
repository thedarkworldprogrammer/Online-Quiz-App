import express from 'express';
import { dbService } from '../services/dbService';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const courses = await dbService.getCourses();
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, code, semester, batch, session, subjects } = req.body;
    const newCourse = await dbService.addCourse({
      id: `crs-${Date.now()}`,
      name,
      code,
      semester,
      batch,
      session,
      subjects: subjects || []
    });
    res.json(newCourse);
  } catch (error) {
    next(error);
  }
});

export default router;
