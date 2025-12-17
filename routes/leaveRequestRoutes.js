import express from 'express';
import {
  getAllLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  approveLeaveRequest,
  deleteLeaveRequest
} from '../controllers/leaveRequestController.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { enforceMAC } from '../middleware/macMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js'; // updated
import { enforceRules } from '../middleware/ruleMiddleware.js'; // RuBAC

const router = express.Router();

/**
 * Get all leave requests
 * RBAC: Manager, HR, Admin
 * ABAC: filter by department/subordinate
 * RuBAC: dynamic rules
 * Activity logging
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('Manager', 'HR', 'Admin'),
  enforceABAC('LeaveRequest', 'view'),
  enforceRules('viewLeaveRequest'),
  activityLogger('viewAllLeaveRequests', 'LeaveRequest'),
  getAllLeaveRequests
);

/**
 * Get leave request by ID
 * RBAC: Employee (own), Manager, HR, Admin
 * ABAC: optional attribute-based checks
 * RuBAC: dynamic rules
 * Activity logging
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'HR', 'Admin'),
  enforceABAC('LeaveRequest', 'view'),
  enforceRules('viewLeaveRequest'),
  activityLogger('viewLeaveRequest', 'LeaveRequest'),
  getLeaveRequestById
);

/**
 * Create leave request
 * RBAC: Employee only
 * ABAC: optional rules (e.g., overlapping leaves)
 * RuBAC: max days, etc.
 * Activity logging
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('Employee'),
  enforceABAC('LeaveRequest', 'create'),
  enforceRules('createLeaveRequest'),
  activityLogger('createLeaveRequest', 'LeaveRequest'),
  createLeaveRequest
);

/**
 * Approve leave request
 * RBAC: Manager, HR
 * ABAC: e.g., cannot approve outside working hours
 * MAC: optional if sensitivity applies
 * RuBAC: max days, override roles, etc.
 * Activity logging
 */
router.put(
  '/:id/approve',
  authenticate,
  authorizeRoles('Manager', 'HR'),
  enforceMAC('update'),
  enforceABAC('LeaveRequest', 'approve'),
  enforceRules('approveLeave'),
  activityLogger('approveLeaveRequest', 'LeaveRequest'),
  approveLeaveRequest
);

/**
 * Delete leave request
 * RBAC: Admin only
 * RuBAC: optional deletion rules
 * Activity logging
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceRules('deleteLeaveRequest'),
  activityLogger('deleteLeaveRequest', 'LeaveRequest'),
  deleteLeaveRequest
);

export default router;
