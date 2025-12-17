import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const RulePolicy = sequelize.define('RulePolicy', {
    name: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    condition_json: { type: DataTypes.JSONB }
}, { tableName: 'rule_policies', timestamps: true });

export default RulePolicy;
