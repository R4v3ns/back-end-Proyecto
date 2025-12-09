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
    },
    {
      sequelize,
      modelName: 'Song',
      tableName: 'songs',
      timestamps: true,
    }
  );

  return Song;
};
