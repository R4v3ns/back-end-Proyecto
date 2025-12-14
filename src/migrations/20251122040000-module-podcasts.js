'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabla: podcasts - Podcasts disponibles
    await queryInterface.createTable('podcasts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false
      },
      coverUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isFeatured: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      episodeCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Tabla: podcast_episodes - Episodios de podcasts
    await queryInterface.createTable('podcast_episodes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      podcastId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'podcasts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duración en segundos'
      },
      audioUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      coverUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      episodeNumber: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      releaseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      playCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para podcasts
    await queryInterface.addIndex('podcasts', ['author']);
    await queryInterface.addIndex('podcasts', ['category']);
    await queryInterface.addIndex('podcasts', ['isFeatured']);

    // Índices para podcast_episodes
    await queryInterface.addIndex('podcast_episodes', ['podcastId']);
    await queryInterface.addIndex('podcast_episodes', ['releaseDate']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('podcast_episodes');
    await queryInterface.dropTable('podcasts');
  }
};



