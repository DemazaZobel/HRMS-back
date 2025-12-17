import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SecurityLabel = sequelize.define('SecurityLabel', {
    name: { type: DataTypes.STRING, primaryKey: true },
    description: { type: DataTypes.STRING }
}, { tableName: 'security_labels', timestamps: false });

export default SecurityLabel;
