image.png'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campo isExample para distinguir canciones reproducibles de ejemplos
    await queryInterface.addColumn('songs', 'isExample', {
      type: Sequelize.INTEGER, // SQLite usa INTEGER para BOOLEAN
      defaultValue: 0,
      allowNull: false,
      comment: 'Indica si es una canción de ejemplo (no reproducible pero agregable a favoritos)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('songs', 'isExample');
  }
};

