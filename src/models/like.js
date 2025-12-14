'use strict';

module.exports = (sequelize, DataTypes) => {
  class Like extends require('sequelize').Model {}

  Like.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      songId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'songs',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Like',
      tableName: 'likes',
      timestamps: true,
    }
  );

  Like.associate = function(models) {
    Like.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    Like.belongsTo(models.Song, {
      foreignKey: 'songId',
      as: 'song',
    });
  };

  return Like;
};



