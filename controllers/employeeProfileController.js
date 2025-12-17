import EmployeeProfile from '../models/EmployeeProfile.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

// Sensitivity levels hierarchy
const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3 };

// ------------------ GET ALL PROFILES (Admin only) ------------------
export const getAllProfiles = async (req, res) => {
  try {
    const profiles = await EmployeeProfile.findAll({
      include: [
        { model: User, as: 'profileUser', attributes: ['id', 'username', 'email', 'sensitivityLevel'] },
        { model: Department, as: 'profileDepartment', attributes: ['id', 'name'] },
        { model: User, as: 'profileManager', attributes: ['id', 'username'] }, // optional if you want manager info
      ],
    });

   

    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------ GET PROFILE BY ID ------------------
export const getProfileById = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findByPk(req.params.id, {
      include: [
        { model: User, as: 'profileUser', attributes: ['id', 'username', 'email', 'sensitivityLevel'] },
        { model: Department, as: 'profileDepartment', attributes: ['id', 'name'] },
        { model: User, as: 'profileManager', attributes: ['id', 'username'] },
      ],
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // MAC: check sensitivity
    const userLevel = req.user.sensitivityLevel || 'Public';
    const profileLevel = profile.sensitivityLevel || 'Internal';
    if (levels[userLevel] < levels[profileLevel]) {
      return res.status(403).json({ message: 'Access denied by MAC policy' });
    }

    // Employee can only view their own profile
    if (req.user.roles.includes('Employee') && req.user.id !== profile.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Manager can only view profiles in their department
    if (req.user.roles.includes('Manager')) {
      const managerProfile = await EmployeeProfile.findOne({ where: { user_id: req.user.id } });
      if (managerProfile.department_id !== profile.department_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------ CREATE PROFILE (Admin only) ------------------
export const createProfile = async (req, res) => {
  const { user_id, department_id, manager_id, position, sensitivityLevel, salary } = req.body;

  // Only Admin can assign sensitivity level
  if (sensitivityLevel && !req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'Only Admin can assign sensitivity levels' });
  }

  try {
    const profile = await EmployeeProfile.create({
      user_id,
      department_id,
      manager_id,
      position,
      sensitivityLevel: sensitivityLevel || 'Internal', // default
      salary: salary || null,
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------ UPDATE PROFILE ------------------
export const updateProfile = async (req, res) => {
  console.log("=== Update Request Info ===");
  console.log("Authenticated user:", req.user); // check name, role, department, sensitivity
  console.log("Target profile ID:", req.params.id);
  console.log("Request body:", req.body);
  try {
    const profile = await EmployeeProfile.findByPk(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Employee can only update own profile
    if (req.user.roles.includes('Employee') && req.user.id !== profile.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Manager can only update employees in their department
    if (req.user.roles.includes('Manager')) {
      const managerProfile = await EmployeeProfile.findOne({ where: { user_id: req.user.id } });
      if (managerProfile.department_id !== profile.department_id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const { department_id, manager_id, position, sensitivityLevel, salary } = req.body;

    if (department_id) profile.department_id = department_id;
    if (manager_id) profile.manager_id = manager_id;
    if (position) profile.position = position;
    if (salary) profile.salary = salary; 

    // Only Admin can update sensitivity level
    if (sensitivityLevel) {
      if (!req.user.roles.includes('Admin')) {
        return res.status(403).json({ message: 'Only Admin can change sensitivity levels' });
      }
      profile.sensitivityLevel = sensitivityLevel;
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------ DELETE PROFILE (Admin only) ------------------
export const deleteProfile = async (req, res) => {
  try {
    // Only Admin can delete
    if (!req.user.roles.includes('Admin')) {
      return res.status(403).json({ message: 'Only Admin can delete profiles' });
    }

    const profile = await EmployeeProfile.findByPk(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    await profile.destroy();
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
