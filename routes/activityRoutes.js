// routes/activityRoutes.js
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getAllActivities, getUserActivities } from '../controllers/activityController.js';
import { activityLogger } from '../middleware/activityLogger.js';

const router = express.Router();

// ------------------ ROUTES ------------------

// Get all activity logs (Admin only)
// Log this action as a system/audit activity
router.get(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  activityLogger('viewAllActivities', 'Activity'),
  getAllActivities
);

// Get activities for a specific user (Admin can view any user)
// Log this action as a user activity
router.get(
  '/:userId',
  authenticate,
  activityLogger('viewUserActivities', 'Activity'),
  getUserActivities
);

export default router;
