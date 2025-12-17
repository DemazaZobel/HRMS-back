import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Role from './Role.js';

const RoleChangeRequest = sequelize.define('RoleChangeRequest', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  requested_role_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
  reason: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'role_change_requests', timestamps: true });



export default RoleChangeRequest;
