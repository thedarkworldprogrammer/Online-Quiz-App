import express from 'express';
import { assignmentController } from '../controllers/assignmentController.js';
import { authMiddleware, requireRole } from '../utils/auth.js';

const router = express.Router();

// Protect all assignment endpoints with JWT authentication
router.use(authMiddleware as any);

// Assignment creation and retrieval
router.get('/', assignmentController.getAllAssignments);
router.post('/', requireRole(['teacher', 'admin']) as any, assignmentController.createAssignment);

// Submission management
router.get('/submissions', assignmentController.getAllSubmissions);
router.post('/:id/submit', assignmentController.submitAssignment);
router.post('/submissions/:id/grade', requireRole(['teacher', 'admin']) as any, assignmentController.gradeSubmission);

export default router;
