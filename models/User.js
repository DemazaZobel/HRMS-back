// models/User.js (partial)
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  sensitivityLevel: {
    type: DataTypes.ENUM('Public', 'Internal', 'Confidential'),
    defaultValue: 'Public',
  },
}, {
  tableName: 'users'
});

User.beforeCreate(async (user) => {
  if (user.password_hash) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});


User.prototype.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password_hash);
};

export default User;
