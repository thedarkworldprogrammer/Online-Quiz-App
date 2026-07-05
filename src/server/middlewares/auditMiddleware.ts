import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/auth.js';
import { logAction } from '../utils/auditLogger.js';

/**
 * Reusable Express middleware to automatically intercept sensitive API requests
 * (login, grading, submission) and save them to the AuditLog collection.
 */
export function auditMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const path = req.originalUrl || req.url;
  const method = req.method;

  // Identify sensitive API endpoints
  const isLogin = (path.includes('/auth/login') || path.includes('/auth/otp/verify')) && method === 'POST';
  const isQuizSubmit = path.includes('/attempt') && method === 'POST';
  const isAssignmentSubmit = path.includes('/submit') && method === 'POST';
  const isGrading = path.includes('/grade') && method === 'POST';

  // If this is not a sensitive request, bypass the interceptor immediately
  if (!isLogin && !isQuizSubmit && !isAssignmentSubmit && !isGrading) {
    return next();
  }

  // Hook into response serialization methods to capture returned payloads (like user info or scores)
  const originalJson = res.json;
  const originalSend = res.send;

  let responseBody: any = null;

  res.json = function (body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.send = function (body: any) {
    if (!responseBody && typeof body === 'string') {
      try {
        responseBody = JSON.parse(body);
      } catch (e) {
        // Not JSON formatted
      }
    }
    return originalSend.call(this, body);
  };

  // Perform non-blocking logging asynchronously on response completion
  res.on('finish', async () => {
    try {
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 300;

      let userId: string | null = null;
      let action = '';
      let details = '';

      // Extract user ID from authenticated request if available
      if (req.user) {
        userId = req.user.id;
      } else if (isSuccess && responseBody?.user) {
        userId = responseBody.user.id;
      }

      if (isLogin) {
        const email = req.body?.email || 'unknown';
        const isOtp = path.includes('/otp/verify');
        if (isSuccess) {
          action = isOtp ? 'OTP_VERIFY_SUCCESS' : 'USER_LOGIN';
          details = isOtp
            ? `Successfully authenticated via OTP verification for email: ${email}`
            : `Password login successful for email: ${email}`;
        } else {
          action = isOtp ? 'OTP_VERIFY_FAILED' : 'LOGIN_FAILED';
          const errorMsg = responseBody?.error || 'Invalid credentials';
          details = `Failed login attempt for email: ${email}. Reason: ${errorMsg}`;
        }
      } else if (isQuizSubmit) {
        const parts = path.split('/').filter(Boolean);
        const quizId = req.params.id || parts[parts.length - 2] || 'unknown';
        if (isSuccess) {
          action = 'QUIZ_SUBMIT';
          const score = responseBody?.attempt?.score;
          const totalPoints = responseBody?.attempt?.totalPoints;
          const tabSwitches = req.body?.tabSwitches || 0;
          details = `Submitted quiz attempt for Quiz ID: ${quizId}. ` +
            (score !== undefined ? `Score: ${score}/${totalPoints}. ` : '') +
            `Tab switches: ${tabSwitches}. Fullscreen violation: ${!!req.body?.isFullScreenViolation}`;
        } else {
          action = 'QUIZ_SUBMIT_FAILED';
          const errorMsg = responseBody?.error || 'Unknown error';
          details = `Failed quiz submission for Quiz ID: ${quizId}. Reason: ${errorMsg}`;
        }
      } else if (isAssignmentSubmit) {
        const parts = path.split('/').filter(Boolean);
        const assignmentId = req.params.id || parts[parts.length - 2] || 'unknown';
        if (isSuccess) {
          action = 'ASSIGNMENT_SUBMIT';
          const fileName = req.body?.fileName || responseBody?.fileName || 'unknown';
          const grade = responseBody?.grade;
          details = `Submitted assignment for Assignment ID: ${assignmentId}. File: "${fileName}". ` +
            (grade !== undefined ? `Auto-graded: ${grade}. Plagiarism score: ${responseBody?.plagiarismScore}%` : '');
        } else {
          action = 'ASSIGNMENT_SUBMIT_FAILED';
          const errorMsg = responseBody?.error || 'Unknown error';
          details = `Failed assignment submission for Assignment ID: ${assignmentId}. Reason: ${errorMsg}`;
        }
      } else if (isGrading) {
        const parts = path.split('/').filter(Boolean);
        const submissionId = req.params.id || parts[parts.length - 2] || 'unknown';
        if (isSuccess) {
          action = 'SUBMISSION_GRADE';
          const grade = req.body?.grade ?? responseBody?.grade;
          details = `Successfully graded submission ID: ${submissionId}. Grade assigned: ${grade}.`;
        } else {
          action = 'SUBMISSION_GRADE_FAILED';
          const errorMsg = responseBody?.error || 'Unknown error';
          details = `Failed to grade submission ID: ${submissionId}. Reason: ${errorMsg}`;
        }
      }

      if (action) {
        await logAction(userId, action, details, req);
      }
    } catch (auditErr) {
      console.error('⚠️ Interceptor audit logging failed:', auditErr);
    }
  });

  next();
}
