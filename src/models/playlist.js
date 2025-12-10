'use strict';

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  class Playlist extends require('sequelize').Model {}

  Playlist.init(
    {
      id: {
        type: DataTypes.STRING(36),
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Playlist',
      tableName: 'playlists',
      timestamps: true,
    }
  );

  Playlist.associate = function(models) {
    Playlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    // Relación many-to-many con Song usando la tabla playlist_songs
    Playlist.belongsToMany(models.Song, {
      through: 'playlist_songs',
      foreignKey: 'playlistId',
      otherKey: 'songId',
      as: 'songs',
    });
  };

  return Playlist;
};

