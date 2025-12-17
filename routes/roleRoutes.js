import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js'; // improved logger
import { enforceRules } from '../middleware/ruleMiddleware.js'; // RuBAC
import { assignRole, removeRole, getUserRoles, getUsersWithRoles } from '../controllers/roleController.js';

const router = express.Router();

/**
 * Assign a role to a user
 * RBAC: Admin only
 * ABAC: e.g., cannot assign roles higher than own level
 * RuBAC: dynamic checks on hierarchy/department
 * Activity logging: logs username, IP, user-agent, timestamp, action, module
 */
router.post(
  '/assign',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('Role', 'assign'),
  enforceRules('assignRole'),
  activityLogger('assignRole', 'Role'),
  assignRole
);

/**
 * Remove a role from a user
 * RBAC: Admin only
 * ABAC: optional rules
 * RuBAC: e.g., cannot remove roles higher than own authority
 * Activity logging
 */
router.post(
  '/remove',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('Role', 'remove'),
  enforceRules('removeRole'),
  activityLogger('removeRole', 'Role'),
  removeRole
);

router.get(
  '/users-with-roles',
   authenticate, 
   authorizeRoles('Admin'), 
   getUsersWithRoles
);

/**
 * Get roles of a user
 * RBAC: Admin, Manager
 * ABAC: optional filtering (e.g., only same department)
 * RuBAC: dynamic rules for visibility
 * Activity logging
 */
router.get(
  '/:userId',
  authenticate,
  authorizeRoles('Admin', 'Manager'),
  enforceABAC('Role', 'view'),
  enforceRules('viewUserRoles'),
  activityLogger('getUserRoles', 'Role'),
  getUserRoles
);



export default router;
