import express from 'express';
import { dbService } from '../services/dbService';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const announcements = await dbService.getAnnouncements();
    res.json(announcements);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, content, courseId, authorName } = req.body;
    const newAnn = await dbService.addAnnouncement({
      id: `ann-${Date.now()}`,
      title,
      content,
      courseId: courseId || 'crs-1',
      authorName: authorName || 'Prof. Sarah Jenkins',
      createdAt: new Date().toISOString()
    });
    res.json(newAnn);
  } catch (error) {
    next(error);
  }
});

export default router;
