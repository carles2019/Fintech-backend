const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transfer_pin: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: false
  });

  // 🔐 Hash PIN before saving
  User.beforeSave(async (user) => {
    if (user.transfer_pin && user.changed('transfer_pin')) {
      const salt = await bcrypt.genSalt(10);
      user.transfer_pin = await bcrypt.hash(user.transfer_pin, salt);
    }
  });

  return User;
};