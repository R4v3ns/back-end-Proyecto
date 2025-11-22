'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('songs', [
      {
        title: 'Canción de Ejemplo 1',
        artist: 'Artista Ejemplo',
        duration: 180, // 3 minutos
        coverUrl: '/uploads/images/cover1.jpg',
        audioUrl: '/uploads/audio/song1.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Canción de Ejemplo 2',
        artist: 'Artista Ejemplo',
        duration: 240, // 4 minutos
        coverUrl: '/uploads/images/cover2.jpg',
        audioUrl: '/uploads/audio/song2.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Canción de Ejemplo 3',
        artist: 'Otro Artista',
        duration: 200, // 3:20 minutos
        coverUrl: '/uploads/images/cover3.jpg',
        audioUrl: '/uploads/audio/song3.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('songs', null, {});
  },
};

