'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('songs', [
      {
        title: 'Pasajero',
        artist: 'King Savagge, Lyon la f, Katteyes',
        duration: 180,
        coverUrl: 'https://via.placeholder.com/500/FF6B35/FFFFFF?text=Pasajero',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'La Perla',
        artist: 'ROSALÍA, Yahritza Y Su Esencia',
        duration: 210,
        coverUrl: 'https://via.placeholder.com/500/87CEEB/FFFFFF?text=La+Perla',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Supersonic',
        artist: 'Oasis',
        duration: 227,
        coverUrl: 'https://via.placeholder.com/500/FFB6C1/FFFFFF?text=Supersonic',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'VLONE',
        artist: 'Julianno Sosa, Pablo Chill-E',
        duration: 195,
        coverUrl: 'https://via.placeholder.com/500/FF69B4/FFFFFF?text=VLONE',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Cuando No Era Cantante',
        artist: 'El Bogueto, Yung Beef',
        duration: 200,
        coverUrl: 'https://via.placeholder.com/500/FFA500/FFFFFF?text=Cantante',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'RAPIDO',
        artist: 'Polimá Westcoast',
        duration: 185,
        coverUrl: 'https://via.placeholder.com/500/FF0000/FFFFFF?text=RAPIDO',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('songs', null, {});
  }
};
