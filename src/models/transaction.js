module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('FUND', 'TRANSFER_OUT', 'TRANSFER_IN'),
        allowNull: false
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      meta: {
        type: DataTypes.JSON,
        allowNull: true
      }
    }, {
      tableName: 'transactions',
      timestamps: false
    });
  
    return Transaction;
  };