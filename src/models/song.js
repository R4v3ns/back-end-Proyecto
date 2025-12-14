'use strict';

module.exports = (sequelize, DataTypes) => {
  class Song extends require('sequelize').Model {}

  Song.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      artist: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      album: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      genre: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER, // en segundos
        allowNull: false,
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      youtubeId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID del video de YouTube para conversión a audio',
      },
      // Campos para exploración y destacados
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      playCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      releaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isExample: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si es una canción de ejemplo (no reproducible pero agregable a favoritos)',
      },
    },
    {
      sequelize,
      modelName: 'Song',
      tableName: 'songs',
      timestamps: true,
    }
  );

  Song.associate = function(models) {
    // Relación many-to-many con Playlist usando la tabla playlist_songs
    Song.belongsToMany(models.Playlist, {
      through: 'playlist_songs',
      foreignKey: 'songId',
      otherKey: 'playlistId',
      as: 'playlists',
    });
    Song.hasMany(models.Like, {
      foreignKey: 'songId',
      as: 'likes',
    });
  };

  return Song;
};
