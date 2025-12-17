import express from 'express';
import {
  getAllSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary
} from '../controllers/salaryController.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { enforceMAC } from '../middleware/macMiddleware.js';
import { enforceABAC } from '../middleware/abacMiddleware.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { enforceRules } from '../middleware/ruleMiddleware.js';

const router = express.Router();

/**
 * Get all salaries
 */
router.get(
  '/',
  authenticate,
  authorizeRoles('Admin', 'Manager'),
  enforceMAC('view'),
  enforceABAC('SalaryRecord', 'view'),
  enforceRules('viewAllSalaries'), // dynamic filtering: department, subordinates
  activityLogger('viewAllSalaries', 'SalaryRecord'),
  getAllSalaries
);

/**
 * Get salary by ID
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles('Admin', 'Manager', 'Employee'),
  enforceMAC('view'),
  enforceABAC('SalaryRecord', 'view'),
  enforceRules('viewSalary'), // dynamic: Employee can only see own, Manager limited to dept
  activityLogger('viewSalary', 'SalaryRecord'),
  getSalaryById
);

/**
 * Create salary record
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('create'),
  enforceABAC('SalaryRecord', 'create'),
  enforceRules('createSalary'), // dynamic checks: cannot assign salary beyond limits
  activityLogger('createSalary', 'SalaryRecord'),
  createSalary
);

/**
 * Update salary record
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('update'),
  enforceABAC('SalaryRecord', 'update'),
  enforceRules('updateSalary'), // dynamic rules: cannot escalate pay beyond policy
  activityLogger('updateSalary', 'SalaryRecord'),
  updateSalary
);

/**
 * Delete salary record
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('Admin'),
  enforceMAC('delete'),
  enforceABAC('SalaryRecord', 'delete'),
  enforceRules('deleteSalary'), // optional dynamic deletion rules
  activityLogger('deleteSalary', 'SalaryRecord'),
  deleteSalary
);

export default router;
