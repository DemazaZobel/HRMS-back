import express from 'express';
import {
  getAllProfiles,
  getProfileById,
  getCurrentUserProfile,
  createProfile,
  updateProfile,
  deleteProfile,
} from '../controllers/employeeProfileController.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceMAC } from '../middleware/macMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js'; // updated

const router = express.Router();

/**
 * Get current user's employee profile
 */
router.get(
  '/me',
  authenticate,
  activityLogger('viewOwnProfile', 'EmployeeProfile'),
  getCurrentUserProfile
);

/**
 * Get employee profile by profile ID
 */
router.get(
  '/:id',
  authenticate,
  activityLogger('viewProfile', 'EmployeeProfile'),
  getProfileById
);

router.get(
  '/',
  authenticate,
  activityLogger('viewAllProfiles', 'EmployeeProfile'),
  getAllProfiles
);

/**
 * Get profile by ID
 * MAC: enforce sensitivity level
 * ABAC: enforce department or attribute-based rules
 * RBAC: Employee can view own, Manager/Admin as per rules
 * Activity logging
 */


/**
 * Create employee profile
 * RBAC: Admin only
 * Activity logging
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  activityLogger('createProfile', 'EmployeeProfile'),
  createProfile
);

/**
 * Update employee profile
 * MAC: enforce sensitivity level
 * ABAC: enforce department or attribute-based rules
 * RBAC: Admin only
 * Activity logging
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('update'),
  enforceABAC('EmployeeProfile', 'update'),
  activityLogger('updateProfile', 'EmployeeProfile'),
  updateProfile
);

/**
 * Delete employee profile
 * RBAC: Admin only
 * Activity logging
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  activityLogger('deleteProfile', 'EmployeeProfile'),
  deleteProfile
);

export default router;
