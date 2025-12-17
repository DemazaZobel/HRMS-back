import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const LeaveRequest = sequelize.define('LeaveRequest', {
    start_date: { type: DataTypes.DATE },
    end_date: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' }
}, { tableName: 'leave_requests', timestamps: true });

export default LeaveRequest;
