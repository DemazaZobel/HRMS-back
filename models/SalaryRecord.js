import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SalaryRecord = sequelize.define('SalaryRecord', {
    amount: { type: DataTypes.DECIMAL(12,2) },
    currency: { type: DataTypes.STRING, defaultValue: 'ETB' },
    effective_date: { type: DataTypes.DATE }
}, { tableName: 'salary_records', timestamps: true });

export default SalaryRecord;
