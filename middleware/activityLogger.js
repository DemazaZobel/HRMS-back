import { logActivity } from '../controllers/activityController.js';

/**
 * Middleware to log any user activity in a route
 * @param {string} actionName - Name of the action (e.g., 'createDocument')
 * @param {string} moduleName - Module/project section
 */
export const activityLogger = (actionName, moduleName = 'General') => {
  return async (req, res, next) => {
    try {
      const details = JSON.stringify({
        body: req.body,
        params: req.params,
        query: req.query
      });

      await logActivity(
        req.user?.id || null,
        actionName,
        details,
        req.ip,
        req.headers['user-agent'],
        moduleName
      );
    } catch (error) {
      console.error('Activity logger failed:', error);
    }
    next();
  };
};
