'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabla: playlists - Playlists de usuario
    await queryInterface.createTable('playlists', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      coverUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isPublic: {
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

    // Tabla: playlist_songs - Relación entre playlists y canciones
    await queryInterface.createTable('playlist_songs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      playlistId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'playlists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      songId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'songs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      addedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Tabla: likes - Sistema de "Me gusta" (likes)
    await queryInterface.createTable('likes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      songId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'songs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para playlists
    await queryInterface.addIndex('playlists', ['userId']);
    await queryInterface.addIndex('playlists', ['isPublic']);

    // Índices para playlist_songs
    await queryInterface.addIndex('playlist_songs', ['playlistId']);
    await queryInterface.addIndex('playlist_songs', ['songId']);
    await queryInterface.addIndex('playlist_songs', ['playlistId', 'position']);
    await queryInterface.addIndex('playlist_songs', ['playlistId', 'songId'], {
      unique: true,
      name: 'playlist_songs_unique'
    });

    // Índices para likes
    await queryInterface.addIndex('likes', ['userId']);
    await queryInterface.addIndex('likes', ['songId']);
    await queryInterface.addIndex('likes', ['userId', 'songId'], {
      unique: true,
      name: 'likes_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('playlist_songs');
    await queryInterface.dropTable('likes');
    await queryInterface.dropTable('playlists');
  }
};




