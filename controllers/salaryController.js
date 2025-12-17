import SalaryRecord from '../models/SalaryRecord.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import User from '../models/User.js';

// Sensitivity levels hierarchy
const levels = { 'Public': 1, 'Internal': 2, 'Confidential': 3 };

// Get all salary records (with MAC)
export const getAllSalaries = async (req, res) => {
  try {
    const salaries = await SalaryRecord.findAll({
      include: [
        { model: EmployeeProfile, as: 'employee', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'sensitivityLevel'] }] }
      ],
    });

    const userLevel = req.user.sensitivityLevel || 'Public';
    const accessible = salaries.filter(s => {
      const recordLevel = s.employee?.sensitivityLevel || 'Internal';
      return levels[userLevel] >= levels[recordLevel];
    });

    res.json(accessible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get salary by ID
export const getSalaryById = async (req, res) => {
  try {
    const salary = await SalaryRecord.findByPk(req.params.id, {
      include: [
        { model: EmployeeProfile, as: 'employee', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'sensitivityLevel'] }] }
      ],
    });
    if (!salary) return res.status(404).json({ message: 'Salary record not found' });

    const userLevel = req.user.sensitivityLevel || 'Public';
    const recordLevel = salary.employee?.sensitivityLevel || 'Internal';
    if (levels[userLevel] < levels[recordLevel]) {
      return res.status(403).json({ message: 'Access denied by MAC policy' });
    }

    res.json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create salary record (Admin only)
export const createSalary = async (req, res) => {
  if (!req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'Only Admin can create salary records' });
  }

  try {
    const { employee_id, amount, currency, effective_date } = req.body;
    const salary = await SalaryRecord.create({ employee_id, amount, currency, effective_date });
    res.status(201).json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update salary (Admin only)
export const updateSalary = async (req, res) => {
  if (!req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'Only Admin can update salary records' });
  }

  try {
    const salary = await SalaryRecord.findByPk(req.params.id);
    if (!salary) return res.status(404).json({ message: 'Salary record not found' });

    const { amount, currency, effective_date } = req.body;
    if (amount) salary.amount = amount;
    if (currency) salary.currency = currency;
    if (effective_date) salary.effective_date = effective_date;

    await salary.save();
    res.json(salary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete salary (Admin only)
export const deleteSalary = async (req, res) => {
  if (!req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'Only Admin can delete salary records' });
  }

  try {
    const salary = await SalaryRecord.findByPk(req.params.id);
    if (!salary) return res.status(404).json({ message: 'Salary record not found' });

    await salary.destroy();
    res.json({ message: 'Salary record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
