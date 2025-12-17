import Department from '../models/Department.js';
import User from '../models/User.js';
import EmployeeProfile from '../models/EmployeeProfile.js'; // for checking associated employees

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: { model: User, as: 'departmentManager', attributes: ['id', 'username', 'email'] },
    });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: { model: User, as: 'departmentManager', attributes: ['id', 'username', 'email'] },
    });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create department (Admin only)
export const createDepartment = async (req, res) => {
  const { name, manager_id } = req.body;
  try {
    const department = await Department.create({ name, manager_id });
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update department (Admin only)
export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const { name, manager_id } = req.body;
    if (name) department.name = name;
    if (manager_id) department.manager_id = manager_id;

    await department.save();
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete department (Admin only, only if no employees)
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const employeeCount = await EmployeeProfile.count({ where: { department_id: department.id } });
    if (employeeCount > 0) {
      return res.status(400).json({ message: 'Cannot delete department with employees assigned' });
    }

    await department.destroy();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
