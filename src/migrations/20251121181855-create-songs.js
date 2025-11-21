'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('songs', {
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
      artist: {
        type: Sequelize.STRING,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duración en segundos'
      },
      coverUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      audioUrl: {
        type: Sequelize.STRING,
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

    // Agregar índices para mejorar el rendimiento
    await queryInterface.addIndex('songs', ['title']);
    await queryInterface.addIndex('songs', ['artist']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('songs');
  }
};
