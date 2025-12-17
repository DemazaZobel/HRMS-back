// models/index.js
import sequelize from '../config/db.js';

// Import models
import User from './User.js';
import Role from './Role.js';
import UserRole from './UserRole.js';
import Department from './Department.js';
import EmployeeProfile from './EmployeeProfile.js';
import SecurityLabel from './SecurityLabel.js';
import SalaryRecord from './SalaryRecord.js';
import Document from './Document.js';
import DocumentPermission from './DocumentPermission.js';
import LeaveRequest from './LeaveRequest.js';
import ActivityLog from './ActivityLog.js';
import MfaCode from './MfaCode.js';
import RulePolicy from './RulePolicy.js';

// ------------------- RELATIONSHIPS -------------------

// ----- Users & Roles (Many-to-Many) -----
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', as: 'users' });

// ----- Departments & Manager (One-to-One) -----
Department.belongsTo(User, { as: 'departmentManager', foreignKey: 'manager_id' });
User.hasOne(Department, { as: 'managedDepartment', foreignKey: 'manager_id' });

// ----- EmployeeProfile -----
EmployeeProfile.belongsTo(User, { foreignKey: 'user_id', as: 'profileUser' });
User.hasOne(EmployeeProfile, { foreignKey: 'user_id', as: 'employeeProfile' });

EmployeeProfile.belongsTo(Department, { foreignKey: 'department_id', as: 'profileDepartment' });
Department.hasMany(EmployeeProfile, { foreignKey: 'department_id', as: 'departmentEmployees' });

EmployeeProfile.belongsTo(User, { foreignKey: 'manager_id', as: 'profileManager' });
User.hasMany(EmployeeProfile, { foreignKey: 'manager_id', as: 'teamMembers' });

// ----- Salary Records -----
SalaryRecord.belongsTo(EmployeeProfile, { foreignKey: 'employee_id', as: 'salaryEmployee' });
EmployeeProfile.hasMany(SalaryRecord, { foreignKey: 'employee_id', as: 'employeeSalaryRecords' });

SalaryRecord.belongsTo(SecurityLabel, { foreignKey: 'security_label', as: 'salarySecurityLabel' });
SecurityLabel.hasMany(SalaryRecord, { foreignKey: 'security_label', as: 'salaryRecords' });

// ----- Documents -----
Document.belongsTo(User, { as: 'documentOwner', foreignKey: 'owner_id' });
User.hasMany(Document, { as: 'documentsOwned', foreignKey: 'owner_id' });

Document.belongsTo(SecurityLabel, { foreignKey: 'security_label', as: 'documentSecurityLabel' });
SecurityLabel.hasMany(Document, { foreignKey: 'security_label', as: 'documents' });

// ----- Document Permissions (DAC) -----
Document.belongsToMany(User, { through: DocumentPermission, foreignKey: 'resource_id', as: 'usersWithAccess' });
User.belongsToMany(Document, { through: DocumentPermission, foreignKey: 'user_id', as: 'documentsAccessible' });

// ----- Leave Requests -----
LeaveRequest.belongsTo(EmployeeProfile, { foreignKey: 'employee_id', as: 'leaveEmployee' });
EmployeeProfile.hasMany(LeaveRequest, { foreignKey: 'employee_id', as: 'employeeLeaveRequests' });

LeaveRequest.belongsTo(User, { foreignKey: 'approved_by', as: 'leaveApprovedBy' });
User.hasMany(LeaveRequest, { foreignKey: 'approved_by', as: 'approvedLeaves' });

// ----- Activity Logs -----
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'activityUser' });
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });

// ----- MFA Codes -----
MfaCode.belongsTo(User, { foreignKey: 'user_id', as: 'mfaUser' });
User.hasMany(MfaCode, { foreignKey: 'user_id', as: 'mfaCodes' });

// ----- Rule Policies -----
// No FK, standalone table

// ------------------- EXPORT -------------------
const syncDB = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('All models synced successfully with unique aliases!');
    } catch (err) {
        console.error('Error syncing models:', err);
    }
};

export {
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
    ActivityLog,
    MfaCode,
    RulePolicy,
    syncDB
};
