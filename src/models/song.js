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
        validate: {
          notEmpty: true,
        },
      },
      artist: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duración en segundos',
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
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

