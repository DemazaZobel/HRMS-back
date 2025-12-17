import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js'; // improved for audit
import { enforceRules } from '../middleware/ruleMiddleware.js'; // RuBAC
import {
  requestRoleChange,
  approveRoleChange,
  rejectRoleChange,
  getPendingRequests
} from '../controllers/roleRequestController.js';

const router = express.Router();

/**
 * Employee or Manager requests a role change
 * RBAC: Employee, Manager
 * ABAC: e.g., cannot request a role they already have
 * RuBAC: dynamic checks: max role hierarchy, department, etc.
 * Activity logging: full audit
 */
router.post(
  '/request',
  authenticate,
  authorizeRoles('Employee', 'Manager'),
  enforceABAC('RoleChangeRequest', 'request'),
  enforceRules('requestRoleChange'),
  activityLogger('requestRoleChange', 'RoleChangeRequest'),
  requestRoleChange
);

/**
 * Admin approves a role change
 * RBAC: Admin only
 * ABAC: e.g., cannot approve beyond authority
 * RuBAC: dynamic rules: check role hierarchy, limits
 * Activity logging
 */
router.post(
  '/approve/:requestId',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('RoleChangeRequest', 'approve'),
  enforceRules('approveRoleChange'),
  activityLogger('approveRoleChange', 'RoleChangeRequest'),
  approveRoleChange
);

/**
 * Admin rejects a role change
 * RBAC: Admin only
 * ABAC/RuBAC: optional rules for rejection
 * Activity logging
 */
router.post(
  '/reject/:requestId',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('RoleChangeRequest', 'reject'),
  enforceRules('rejectRoleChange'),
  activityLogger('rejectRoleChange', 'RoleChangeRequest'),
  rejectRoleChange
);

/**
 * Admin views pending role change requests
 * RBAC: Admin only
 * RuBAC: optional filtering by department/role
 * Activity logging
 */
router.get(
  '/pending',
  authenticate,
  authorizeRoles('Admin'),
  enforceRules('viewPendingRoleRequests'),
  activityLogger('viewPendingRoleRequests', 'RoleChangeRequest'),
  getPendingRequests
);

export default router;
