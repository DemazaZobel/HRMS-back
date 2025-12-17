import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { enforceMAC } from '../middleware/macMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js';

const router = express.Router();

// Get all departments
router.get(
  '/',
  authenticate,
  authorizeRoles('Admin', 'Manager', 'Employee'),
  enforceABAC('Department', 'viewDepartments'),
  activityLogger('viewDepartments', 'Department'),
  getDepartments
);

// Get single department
router.get(
  '/:id',
  authenticate,
  authorizeRoles('Admin', 'Manager'),
  enforceABAC('Department', 'viewDepartment'),
  enforceMAC('view'),
  activityLogger('viewDepartment', 'Department'),
  getDepartmentById
);

// Create department
router.post(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('Department', 'createDepartment'),
  activityLogger('createDepartment', 'Department'),
  createDepartment
);

// Update department
router.put(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('Department', 'updateDepartment'),
  activityLogger('updateDepartment', 'Department'),
  updateDepartment
);

// Delete department
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceABAC('Department', 'deleteDepartment'),
  activityLogger('deleteDepartment', 'Department'),
  deleteDepartment
);

export default router;
