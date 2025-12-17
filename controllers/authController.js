import { User, Role,EmployeeProfile } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logActivity } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

// Signup - Employee registration
export const signup = async (req, res) => {
  const { username, email, password, department_id, position } = req.body;

  try {
    const errors = [];

    // 1️⃣ Validate required fields manually
    if (!username) errors.push({ field: "username", message: "Username is required" });
    if (!email) errors.push({ field: "email", message: "Email is required" });
    if (!password) errors.push({ field: "password", message: "Password is required" });
    if (!department_id) errors.push({ field: "department_id", message: "Department is required" });
    if (!position) errors.push({ field: "position", message: "Position is required" });

    if (errors.length > 0) return res.status(400).json({ errors });

    // 2️⃣ Check if email or username already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ errors: [{ field: "email", message: "Email already in use" }] });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ errors: [{ field: "username", message: "Username already taken" }] });

    // 3️⃣ Create new user with hashed password
    const user = await User.create({
      username,
      email,
      password_hash: password, // model should handle hashing
    });

    // 4️⃣ Assign Employee role
    const employeeRole = await Role.findOne({ where: { name: "Employee" } });
    if (employeeRole) await user.addRole(employeeRole);

    // 5️⃣ Create employee profile
    await EmployeeProfile.create({
      user_id: user.id,
      department_id,
      position,
      manager_id: null,
    });

    // 6️⃣ Log signup activity
    await logActivity(user.id, "User signed up", req);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);

    // Sequelize validation errors
    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
      const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ errors });
    }

    res.status(500).json({ message: "Server error" });
  }
};


// Login - Any user


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = user.checkPassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const roles = await user.getRoles();
    const roleNames = roles.map(r => r.name);

    const token = jwt.sign(
      { id: user.id, username: user.username, roles: roleNames },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Log the login activity
    await logActivity(user.id, 'User logged in', req);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



const ADMIN_SECRET = process.env.ADMIN_SECRET;

export const createAdmin = async (req, res) => {
  const { username, email, password, department_id, position, admin_secret } = req.body;

  try {
    // 1️⃣ Verify secret
    if (admin_secret !== ADMIN_SECRET) {
      return res.status(401).json({ message: "Unauthorized. Invalid admin secret." });
    }

    const errors = [];

    // 2️⃣ Validate required fields
    if (!username) errors.push({ field: "username", message: "Username is required" });
    if (!email) errors.push({ field: "email", message: "Email is required" });
    if (!password) errors.push({ field: "password", message: "Password is required" });
    if (!department_id) errors.push({ field: "department_id", message: "Department is required" });
    if (!position) errors.push({ field: "position", message: "Position is required" });

    if (errors.length > 0) return res.status(400).json({ errors });

    // 3️⃣ Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ errors: [{ field: "email", message: "Email already in use" }] });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ errors: [{ field: "username", message: "Username already taken" }] });

    // 4️⃣ Create user
    const user = await User.create({
      username,
      email,
      password_hash: password // model should handle hashing
    });

    // 5️⃣ Assign Admin role
    const adminRole = await Role.findOne({ where: { name: "Admin" } });
    if (adminRole) await user.addRole(adminRole);

    // 6️⃣ Create employee profile
    await EmployeeProfile.create({
      user_id: user.id,
      department_id,
      position,
      manager_id: null
    });

    // 7️⃣ Log activity
    await logActivity(user.id, "Admin user created", req);

    res.status(201).json({ message: "Admin user created successfully" });
  } catch (err) {
    console.error(err);

    if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
      const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ errors });
    }

    res.status(500).json({ message: "Server error" });
  }
};
