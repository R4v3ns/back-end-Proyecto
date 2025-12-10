'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabla: queues - Cola de reproducción del usuario
    await queryInterface.createTable('queues', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.STRING(36),
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      currentSongId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'songs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      currentPosition: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Posición actual en segundos'
      },
      isPlaying: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      shuffle: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      repeat: {
        type: Sequelize.STRING,
        defaultValue: 'off',
        allowNull: false,
        comment: 'off, all, one'
      },
      queueOrder: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array de songIds en orden'
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

    // Índices para queues
    await queryInterface.addIndex('queues', ['userId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('queues');
  }
};


