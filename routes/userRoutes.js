import express from 'express';
import {
  getAllUsers,
  getUserById,
  getShareTargets,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { enforceMAC } from '../middleware/macMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { enforceRules } from '../middleware/ruleMiddleware.js';

const router = express.Router();

/**
 * Get all users (Admin only)
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('view'),
  enforceABAC('User', 'view'),
  enforceRules('getAllUsers'), // dynamic rules: e.g., department visibility
  activityLogger('getAllUsers', 'User'),
  getAllUsers
);

/**
 * Get shareable user targets for documents (basic list)
 */
router.get(
  '/share-targets',
  authenticate,
  authorizeRoles('Employee', 'Manager', 'Admin'),
  activityLogger('getShareTargets', 'User'),
  getShareTargets
);

/**
 * Get user by ID
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('Admin', 'Manager', 'Employee'),
  enforceMAC('view'),
  enforceABAC('User', 'view'),
  enforceRules('getUserById'), // dynamic: Employee can only view own record
  activityLogger('getUserById', 'User'),
  getUserById
);

/**
 * Create user
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('create'),
  enforceABAC('User', 'create'),
  enforceRules('createUser'), // optional dynamic checks: cannot create higher role
  activityLogger('createUser', 'User'),
  createUser
);

/**
 * Update user
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('Admin', 'Employee'),
  enforceMAC('update'),
  enforceABAC('User', 'update'),
  enforceRules('updateUser'), // dynamic: Employee can update only own record
  activityLogger('updateUser', 'User'),
  updateUser
);

/**
 * Delete user
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('delete'),
  enforceABAC('User', 'delete'),
  enforceRules('deleteUser'), // optional dynamic checks: e.g., cannot delete certain roles
  activityLogger('deleteUser', 'User'),
  deleteUser
);

export default router;
