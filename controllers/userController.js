import User from '../models/User.js';
import Role from '../models/Role.js';
import bcrypt from 'bcrypt';

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: { model: Role, as: 'roles', attributes: ['name'] },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: { model: Role, as: 'roles', attributes: ['name'] },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create user (Admin only)
export const createUser = async (req, res) => {
  const { username, email, password, roles } = req.body;
  try {
    const password_hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ username, email, password_hash });
    
    // Assign roles
    if (roles && roles.length) {
      const roleRecords = await Role.findAll({ where: { name: roles } });
      await user.setRoles(roleRecords);
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user (Admin can update anyone, Employee can update own)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { username, email, password } = req.body;
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password_hash = bcrypt.hashSync(password, 10);

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
