// models/Document.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';

const Document = sequelize.define('Document', {
  title: { type: DataTypes.STRING },
  file_path: { type: DataTypes.STRING },
  owner_id: { type: DataTypes.INTEGER, allowNull: false }, // who owns this doc
  visibility: {
    type: DataTypes.ENUM('PUBLIC', 'INTERNAL', 'PRIVATE'),
    defaultValue: 'PRIVATE',
    allowNull: false
  }
}, { tableName: 'documents', timestamps: true });


export default Document;
