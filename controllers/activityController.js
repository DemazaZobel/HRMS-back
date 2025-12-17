import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

/**
 * Log activity (user or system)
 */
export const logActivity = async (userId, action, details = '', ip = null, userAgent = null, module = 'General') => {
  try {
    await ActivityLog.create({
      user_id: userId || null,
      action,
      details,
      ip_address: ip,
      user_agent: userAgent,
      module
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Fetch all activities (Admin only)
 */
export const getAllActivities = async (req, res) => {
  try {
    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const activities = await ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
  }
};

/**
 * Fetch activities for a specific user
 */
export const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id !== parseInt(userId) && !req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const activities = await ActivityLog.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
  }
};

/**
 * Log system events
 */
export const logSystemEvent = async (event, details = '') => {
  try {
    await ActivityLog.create({
      user_id: null,
      action: event,
      module: 'System',
      details
    });
  } catch (error) {
    console.error('Failed to log system event:', error);
  }
};
