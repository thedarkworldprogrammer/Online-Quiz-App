import express from 'express';
import { quizController } from '../controllers/quizController.js';
import { authMiddleware, requireRole } from '../utils/auth.js';

const router = express.Router();

// Protect all quiz routes with JWT verification
router.use(authMiddleware as any);

// Quiz retrieval endpoints
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);

// Quiz attempts tracking
router.get('/attempts', quizController.getAttempts);
router.post('/:id/attempt', quizController.submitAttempt);

// Teacher-only Quiz administration endpoints
router.post('/', requireRole(['teacher', 'admin']) as any, quizController.createQuiz);
router.post('/generate-ai', requireRole(['teacher', 'admin']) as any, quizController.generateAIQuestions);

export default router;
