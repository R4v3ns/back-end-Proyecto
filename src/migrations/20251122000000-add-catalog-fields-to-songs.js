'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar nuevos campos para el catálogo
    await queryInterface.addColumn('songs', 'album', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('songs', 'genre', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    await queryInterface.addColumn('songs', 'isFeatured', {
      type: Sequelize.INTEGER, // SQLite usa INTEGER para BOOLEAN
      defaultValue: 0,
      allowNull: false,
    });
    
    await queryInterface.addColumn('songs', 'playCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });
    
    await queryInterface.addColumn('songs', 'releaseDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Agregar índices para mejorar búsquedas
    await queryInterface.addIndex('songs', ['album']);
    await queryInterface.addIndex('songs', ['genre']);
    await queryInterface.addIndex('songs', ['isFeatured']);
    await queryInterface.addIndex('songs', ['playCount']);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar índices
    await queryInterface.removeIndex('songs', ['album']);
    await queryInterface.removeIndex('songs', ['genre']);
    await queryInterface.removeIndex('songs', ['isFeatured']);
    await queryInterface.removeIndex('songs', ['playCount']);
    
    // Eliminar columnas
    await queryInterface.removeColumn('songs', 'album');
    await queryInterface.removeColumn('songs', 'genre');
    await queryInterface.removeColumn('songs', 'isFeatured');
    await queryInterface.removeColumn('songs', 'playCount');
    await queryInterface.removeColumn('songs', 'releaseDate');
  }
};

