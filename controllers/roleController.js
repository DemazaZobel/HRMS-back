// controllers/roleController.js
import User from '../models/User.js';
import Role from '../models/Role.js';
import UserRole from '../models/UserRole.js';
import ActivityLog from '../models/ActivityLog.js';
/**
 * Assign a role to a user
 */
export const assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    // Only Admin can assign roles
    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Only Admin can assign roles' });
    }

    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);

    if (!user || !role) return res.status(404).json({ message: 'User or Role not found' });

    // Add role
    await user.addRole(role);

    // Log activity
    await ActivityLog.create({
      user_id: req.user.id,
      action: `Assigned role '${role.name}' to user '${user.username}'`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: `Role '${role.name}' assigned to '${user.username}' successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Remove a role from a user
 */
export const removeRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Only Admin can remove roles' });
    }

    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);

    if (!user || !role) return res.status(404).json({ message: 'User or Role not found' });

    // Remove role
    await user.removeRole(role);

    // Log activity
    await ActivityLog.create({
      user_id: req.user.id,
      action: `Removed role '${role.name}' from user '${user.username}'`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: `Role '${role.name}' removed from '${user.username}' successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all roles of a user
 */
export const getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
  include: {
    model: Role,
    as: 'roles', // MUST match the alias defined in your association
    attributes: ['id', 'name'] // optional: only return id and name
  }
});

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ username: user.username, roles: user.roles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getUsersWithRoles = async (req, res) => {
  try {
    const users = await User.findAll({
      include: {
        model: Role,
        as: 'roles',       // Make sure the alias matches your association
        through: { attributes: ['assigned_at'] } // Include pivot table info
      }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
