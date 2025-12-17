import { sequelize } from './models/index.js';
import RulePolicy from './models/RulePolicy.js';

const seedRules = async () => {
  try {
    // Make sure DB is synced
    await sequelize.sync({ alter: true });

    // Clear existing rules
    await RulePolicy.destroy({ where: {} });

    // 1️⃣ System Access Rule (time-based)
    await RulePolicy.create({
      name: 'systemAccess',
      description: 'Only allow access during working hours (8AM - 6PM)',
      condition_json: {
        startHour: 8,
        endHour: 18,
        allowedRoles: ['Admin', 'Manager', 'Employee']
      }
    });

    // 2️⃣ Leave Approval Rule
    await RulePolicy.create({
      name: 'approveLeave',
      description: 'HR Managers can approve leaves exceeding 10 days',
      condition_json: {
        maxDays: 10,
        overrideRoles: ['HR Manager']
      }
    });

    // 3️⃣ Optional: Department-specific access
    await RulePolicy.create({
      name: 'viewHRReports',
      description: 'Only HR Department can view HR reports',
      condition_json: {
        allowedDepartments: ['Human Resources'],
        allowedRoles: ['Manager', 'HR Manager']
      }
    });

    console.log('RulePolicy seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed RulePolicy:', error);
    process.exit(1);
  }
};

seedRules();
