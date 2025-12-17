import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { grantPermission, revokePermission } from '../controllers/documentPermissionController.js';
import { activityLogger } from '../middleware/activityLogger.js'; // updated middleware

const router = express.Router();

/**
 * Grant document permission
 * RBAC: Admin only (or document owner check in controller)
 * Activity logger: captures user, action, IP, user-agent, module
 */
router.post(
  '/grant',
  authenticate,
  authorizeRoles('Admin'),
  activityLogger('grantDocumentPermission', 'DocumentPermission'),
  grantPermission
);

/**
 * Revoke document permission
 * RBAC: Admin only
 * Activity logger: captures user, action, IP, user-agent, module
 */
router.post(
  '/revoke',
  authenticate,
  authorizeRoles('Admin'),
  activityLogger('revokeDocumentPermission', 'DocumentPermission'),
  revokePermission
);

export default router;
