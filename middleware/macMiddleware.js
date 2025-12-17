// middleware/macMiddlewareWithLogging.js
import EmployeeProfile from '../models/EmployeeProfile.js';
import { activityLogger } from './activityLogger.js';

const levels = { Public: 1, Internal: 2, Confidential: 3, HighlySensitive: 4 };

// Helper for consistent deny messages
const deny = async (req, res, reason) => {
  console.warn(`[MAC] Access denied: ${reason}`);
  req.body = { message: reason }; // attach reason for activity logger
  await activityLogger('accessDenied', 'MAC')(req, res, () => {});
  return res.status(403).json({ message: `[MAC] Access denied: ${reason}` });
};

// Main MAC middleware
export const enforceMAC = (action) => {
  return async (req, res, next) => {
    const middlewareName = 'MAC';
    try {
      const { id } = req.params;
      const user = req.user;

      console.log(`[${middlewareName}] Middleware invoked for action: ${action}`);
      console.log(`[${middlewareName}] Request params:`, req.params);
      console.log(`[${middlewareName}] Authenticated user:`, user);

      // Skip resource fetch for create
      let profile = null;
      if (action !== 'create') {
        profile = await EmployeeProfile.findByPk(id);
        if (!profile) return deny(req, res, 'Resource not found');
      }

      const userLevel = user.sensitivityLevel || 'Public';
      const resourceLevel = profile?.sensitivityLevel || 'Internal';

      // Admin bypass
      if (!user.roles.includes('Admin')) {

        if (profile) {
          // No Read Up
          if (action === 'view' && levels[userLevel] < levels[resourceLevel]) {
            return deny(req, res, 'read-up forbidden by MAC');
          }

          // No Write Down
          if ((action === 'update' || action === 'delete') && levels[userLevel] > levels[resourceLevel]) {
            return deny(req, res, 'write-down forbidden by MAC');
          }

          // Department check for Manager
          if (user.roles.includes('Manager')) {
            const managerProfile = await EmployeeProfile.findOne({ where: { user_id: user.id } });
            if (managerProfile.department_id !== profile.department_id) {
              return deny(req, res, 'Managers can only access their department profiles');
            }
          }

          // Employee self-access
          if (user.roles.includes('Employee') && user.id !== profile.user_id) {
            return deny(req, res, 'Employees can only access their own profile');
          }
        }
      }

      // Log allowed access
      req.debug = { message: 'Access granted by MAC', resourceId: profile?.id || 'N/A' };
      await activityLogger('accessAllowed', 'MAC')(req, res, () => {});
      console.log(`[${middlewareName}] Access granted`);

      next();
    } catch (error) {
      console.error('[MAC] Full middleware error:', error);
      res.status(500).json({ message: '[MAC] Server error' });
    }
  };
};

// Middleware to enforce immutable labels
export const enforceImmutableLabel = async (req, res, next) => {
  const user = req.user;
  const { sensitivityLevel } = req.body;

  if (sensitivityLevel && !user.roles.includes('Admin')) {
    req.body = { message: 'Attempted sensitivity change blocked' };
    await activityLogger('accessDenied', 'MAC')(req, res, () => {});
    return res.status(403).json({ message: '[MAC] You cannot change resource sensitivity level' });
  }

  next();
};
