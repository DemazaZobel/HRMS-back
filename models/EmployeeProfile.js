import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EmployeeProfile = sequelize.define('EmployeeProfile', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  manager_id: { type: DataTypes.INTEGER, allowNull: true }, // assigned manager
  position: { type: DataTypes.STRING, allowNull: false },
  salary: { type: DataTypes.FLOAT, allowNull: true },
  sensitivityLevel: {
    type: DataTypes.ENUM('Public', 'Internal', 'Confidential'),
    defaultValue: 'Internal', // salaries are at least Internal
  }
}, {
  tableName: 'employee_profiles',
  timestamps: true
});

export default EmployeeProfile;
