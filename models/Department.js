import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define('Department', {
    name: { type: DataTypes.STRING, unique: true, allowNull: false }
}, { tableName: 'departments', timestamps: true });

export default Department;
