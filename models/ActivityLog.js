import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.LOG_ENCRYPTION_KEY ;
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true }, // null for system events
  action: { type: DataTypes.STRING, allowNull: false },
  module: { type: DataTypes.STRING, allowNull: true }, // e.g., Document, LeaveRequest
  details: { type: DataTypes.TEXT, allowNull: true, 
    set(value) { this.setDataValue('details', value ? encrypt(value) : null); },
    get() { 
      const val = this.getDataValue('details'); 
      return val ? decrypt(val) : null; 
    }
  },
  ip_address: { type: DataTypes.STRING, allowNull: true },
  user_agent: { type: DataTypes.STRING, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'activity_logs',
  updatedAt: false
});



export default ActivityLog;
