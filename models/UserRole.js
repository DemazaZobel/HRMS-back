import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const UserRole = sequelize.define('UserRole', {
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'user_roles', timestamps: false });

export default UserRole;
