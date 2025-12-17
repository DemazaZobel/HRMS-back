import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Document from './Document.js';

const DocumentPermission = sequelize.define('DocumentPermission', {
  resource_id: { type: DataTypes.INTEGER, allowNull: false },  // links to Document
  user_id: { type: DataTypes.INTEGER, allowNull: false },      // who gets permission
  can_view: { type: DataTypes.BOOLEAN, defaultValue: true },
  can_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
  granted_by: { type: DataTypes.INTEGER, allowNull: false },   // owner/admin who assigned
  granted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'document_permissions',
  timestamps: false
});

// Associations


export default DocumentPermission;
