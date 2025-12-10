'use strict';

module.exports = (sequelize, DataTypes) => {
  class Podcast extends require('sequelize').Model {}
  class PodcastEpisode extends require('sequelize').Model {}

  // Modelo Podcast
  Podcast.init(
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
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      episodeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Podcast',
      tableName: 'podcasts',
      timestamps: true,
    }
  );

  // Modelo PodcastEpisode
  PodcastEpisode.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      podcastId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'podcasts',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duración en segundos',
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      episodeNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      releaseDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      playCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'PodcastEpisode',
      tableName: 'podcast_episodes',
      timestamps: true,
    }
  );

  // Asociaciones
  Podcast.associate = function(models) {
    Podcast.hasMany(models.PodcastEpisode || PodcastEpisode, {
      foreignKey: 'podcastId',
      as: 'episodes',
    });
  };

  PodcastEpisode.associate = function(models) {
    PodcastEpisode.belongsTo(models.Podcast || Podcast, {
      foreignKey: 'podcastId',
      as: 'podcast',
    });
  };

  // Exportar Podcast como principal, pero también registrar PodcastEpisode
  // El index.js registrará Podcast, y PodcastEpisode se registrará a través de la asociación
  Podcast.PodcastEpisode = PodcastEpisode;
  
  // Registrar PodcastEpisode en sequelize para que esté disponible
  sequelize.models.PodcastEpisode = PodcastEpisode;
  
  return Podcast;
};

