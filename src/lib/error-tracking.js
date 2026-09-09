/**
 * Error tracking and reporting system
 * Automatically logs errors for debugging and monitoring
 */

import * as errorLogs from '@/data/errorLogs';
import { getCurrentUser } from '@/data/session';

const ERROR_LOG_ENTITY = 'ErrorLog';

/**
 * Log an error for tracking
 */
export async function logError(errorData) {
  try {
    const {
      message,
      code,
      context = {},
      severity = 'error', // 'info', 'warning', 'error', 'critical'
      userId = null,
      schoolId = null,
      stackTrace = null
    } = errorData;

    // Try to get user/school context if not provided
    let finalUserId = userId;
    let finalSchoolId = schoolId;

    try {
      const user = await getCurrentUser();
      if (user && !finalUserId) {
        finalUserId = user.id;
        finalSchoolId = user.active_school_id || null;
      }
    } catch (e) {
      // User not authenticated, continue without user context
    }

    // Create the error log record
    const errorRecord = {
      message,
      code,
      context: JSON.stringify(context),
      severity,
      user_id: finalUserId,
      school_id: finalSchoolId,
      stack_trace: stackTrace,
      timestamp: new Date().toISOString(),
      user_agent: navigator?.userAgent || 'unknown'
    };

    // Try to insert the error log
    try {
      await errorLogs.create(errorRecord);
    } catch (dbError) {
      // If entity doesn't exist or create fails, log to console instead
      console.error('Failed to log error to database:', dbError);
      console.error('Original error:', errorRecord);
    }

    return errorRecord;
  } catch (error) {
    // Fallback to console logging if everything fails
    console.error('Error tracking failed:', error);
    console.error('Failed to track:', errorData);
  }
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await logError({
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        context: { ...context, args },
        severity: 'error',
        stackTrace: error.stack
      });
      throw error;
    }
  };
}

/**
 * Report RLS violation
 */
export async function reportRLSViolation(details) {
  await logError({
    message: 'RLS Violation Detected',
    code: 'RLS_VIOLATION',
    context: details,
    severity: 'critical'
  });
}

/**
 * Report unauthorized access attempt
 */
export async function reportUnauthorizedAccess(resource, userId, schoolId) {
  await logError({
    message: `Unauthorized access attempt to ${resource}`,
    code: 'UNAUTHORIZED_ACCESS',
    context: { resource, userId, schoolId },
    severity: 'critical',
    userId,
    schoolId
  });
}