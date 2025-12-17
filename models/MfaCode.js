import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MfaCode = sequelize.define('MfaCode', {
    code: { type: DataTypes.STRING },
    expires_at: { type: DataTypes.DATE }
}, { tableName: 'mfa_codes', timestamps: true });

export default MfaCode;
