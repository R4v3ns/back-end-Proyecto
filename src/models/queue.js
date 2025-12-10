'use strict';

module.exports = (sequelize, DataTypes) => {
  class Queue extends require('sequelize').Model {}

  Queue.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      currentSongId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'songs',
          key: 'id',
        },
      },
      currentPosition: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Posición actual en segundos',
      },
      isPlaying: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      shuffle: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      repeat: {
        type: DataTypes.STRING,
        defaultValue: 'off',
        allowNull: false,
        comment: 'off, all, one',
      },
      queueOrder: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array de songIds en orden',
        get() {
          const value = this.getDataValue('queueOrder');
          return value ? JSON.parse(value) : [];
        },
        set(value) {
          this.setDataValue('queueOrder', value ? JSON.stringify(value) : null);
        },
      },
    },
    {
      sequelize,
      modelName: 'Queue',
      tableName: 'queues',
      timestamps: true,
    }
  );

  Queue.associate = function(models) {
    Queue.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Queue.belongsTo(models.Song, {
      foreignKey: 'currentSongId',
      as: 'currentSong',
    });
  };

  return Queue;
};


