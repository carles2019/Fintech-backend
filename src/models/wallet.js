module.exports = (sequelize, DataTypes) => {
    const Wallet = sequelize.define('Wallet', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
      },
      balance: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'wallets',
      timestamps: false
    });
  
    return Wallet;
  };