// utils/logger.js
import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (user_id, action, req = null) => {
  try {
    const ip_address = req ? req.ip : null;
    const user_agent = req ? req.headers['user-agent'] : null;

    await ActivityLog.create({
      user_id,
      action,
      ip_address,
      user_agent
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
