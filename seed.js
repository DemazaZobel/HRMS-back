// seeds/initialSeed.js
import { 
    sequelize,
    User,
    Role,
    UserRole,
    Department,
    EmployeeProfile,
    SecurityLabel,
    SalaryRecord,
    Document,
    DocumentPermission,
    LeaveRequest,
    RulePolicy
} from './models/index.js';
import bcrypt from 'bcryptjs';

const seedData = async () => {
  try {
    await sequelize.sync({ force: true }); // drops tables and recreates

    // ----------------- 1. Security Labels -----------------
    const labels = await SecurityLabel.bulkCreate([
      { name: 'Public' },
      { name: 'Internal' },
      { name: 'Confidential' }
    ]);

    // ----------------- 2. Roles -----------------
    const roles = await Role.bulkCreate([
      { name: 'Admin' },
      { name: 'Manager' },
      { name: 'Employee' },
      { name: 'HR' }
    ]);

    // ----------------- 3. Users -----------------
    const salt = await bcrypt.genSalt(10);
    const users = await User.bulkCreate([
  { username: 'admin1', email: 'admin@example.com', password_hash: await bcrypt.hash('Admin@123', salt) },
  { username: 'manager1', email: 'manager@example.com', password_hash: await bcrypt.hash('Manager@123', salt) },
  { username: 'employee1', email: 'employee1@example.com', password_hash: await bcrypt.hash('Employee@123', salt) },
  { username: 'employee2', email: 'employee2@example.com', password_hash: await bcrypt.hash('Employee@123', salt) },
  { username: 'hr1', email: 'hr@example.com', password_hash: await bcrypt.hash('HR@123', salt) }
 ]);

    // ----------------- 4. Assign Roles (UserRoles) -----------------
    await users[0].addRoles([roles[0]]); // admin1 -> Admin
    await users[1].addRoles([roles[1]]); // manager1 -> Manager
    await users[2].addRoles([roles[2]]); // employee1 -> Employee
    await users[3].addRoles([roles[2]]); // employee2 -> Employee
    await users[4].addRoles([roles[3]]); // hr1 -> HR

    // ----------------- 5. Departments -----------------
    const departments = await Department.bulkCreate([
      { name: 'IT', description: 'Information Technology', manager_id: users[1].id },  // manager1
      { name: 'Finance', description: 'Finance Department', manager_id: null } // no manager yet
    ]);

    // ----------------- 6. Employee Profiles -----------------
    const profiles = await EmployeeProfile.bulkCreate([
      { user_id: users[2].id, full_name: 'Employee One', position: 'Developer', department_id: departments[0].id, manager_id: users[1].id, sensitive_level: labels[1].id },
      { user_id: users[3].id, full_name: 'Employee Two', position: 'Accountant', department_id: departments[1].id, manager_id: users[1].id, sensitive_level: labels[1].id }
    ]);

    // ----------------- 7. Salary Records -----------------
    await SalaryRecord.bulkCreate([
      { employee_id: profiles[0].id, amount: 5000, currency: 'USD', department_id: departments[0].id, security_label: labels[2].id },
      { employee_id: profiles[1].id, amount: 4500, currency: 'USD', department_id: departments[1].id, security_label: labels[2].id }
    ]);

    // ----------------- 8. Documents -----------------
    const documents = await Document.bulkCreate([
      { title: 'IT Policy', content: 'IT security guidelines', owner_id: users[2].id, department_id: departments[0].id, security_label: labels[2].id },
      { title: 'Finance Report', content: 'Q1 financial report', owner_id: users[3].id, department_id: departments[1].id, security_label: labels[1].id }
    ]);

    // ----------------- 9. Document Permissions -----------------
    await DocumentPermission.bulkCreate([
  { resource_id: documents[0].id, user_id: users[0].id, can_view: true, can_edit: true, granted_by: users[0].id },
  { resource_id: documents[0].id, user_id: users[1].id, can_view: true, can_edit: false, granted_by: users[0].id },
  { resource_id: documents[1].id, user_id: users[0].id, can_view: true, can_edit: true, granted_by: users[3].id },
  { resource_id: documents[1].id, user_id: users[3].id, can_view: true, can_edit: true, granted_by: users[3].id },
 ]);




    // ----------------- 10. Leave Requests -----------------
    await LeaveRequest.bulkCreate([
      { employee_id: profiles[0].id, start_date: '2025-12-10', end_date: '2025-12-15', status: 'Pending', approved_by: null },
      { employee_id: profiles[1].id, start_date: '2025-12-01', end_date: '2025-12-05', status: 'Approved', approved_by: users[1].id }
    ]);

    // ----------------- 11. Rule Policies -----------------
    await RulePolicy.bulkCreate([
      { name: 'MaxLeaveDays', resource: 'LeaveRequest', action: 'create', condition: 'days <= 10' },
      { name: 'OwnProfileView', resource: 'EmployeeProfile', action: 'view', condition: 'user_id == requester_id' }
    ]);

    console.log('✅ Initial seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
