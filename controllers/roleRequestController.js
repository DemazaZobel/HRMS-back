import RoleChangeRequest from '../models/RoleChangeRequest.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Create a role change request (employee or manager)
 */
export const requestRoleChange = async (req, res) => {
  try {
    const { requestedRoleId, reason } = req.body;
    const userId = req.user.id;

    const role = await Role.findByPk(requestedRoleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const request = await RoleChangeRequest.create({
      user_id: userId,
      requested_role_id: requestedRoleId,
      reason: reason || null
    });

    await ActivityLog.create({
      user_id: userId,
      action: `Requested role change to '${role.name}'`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.status(201).json({ message: 'Role change request submitted', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Admin approves a role change request
 */
export const approveRoleChange = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Only Admin can approve requests' });
    }

    const request = await RoleChangeRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already processed' });

    const user = await User.findByPk(request.user_id);
    const role = await Role.findByPk(request.requested_role_id);

    await user.addRole(role);
    request.status = 'Approved';
    await request.save();

    await ActivityLog.create({
      user_id: req.user.id,
      action: `Approved role change request: '${role.name}' for user '${user.username}'`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: 'Request approved', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Admin rejects a role change request
 */
export const rejectRoleChange = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Only Admin can reject requests' });
    }

    const request = await RoleChangeRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'Rejected';
    await request.save();

    await ActivityLog.create({
      user_id: req.user.id,
      action: `Rejected role change request for user_id ${request.user_id}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    res.json({ message: 'Request rejected', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all pending role change requests (Admin only)
 */
export const getPendingRequests = async (req, res) => {
  try {
    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Only Admin can view requests' });
    }

    const requests = await RoleChangeRequest.findAll({
      where: { status: 'Pending' },
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { model: Role, attributes: ['id', 'name'] }
      ]
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
