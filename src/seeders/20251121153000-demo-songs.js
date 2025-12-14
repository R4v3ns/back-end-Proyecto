'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero eliminar todas las canciones existentes para evitar duplicados
    await queryInterface.bulkDelete('songs', null, {});
    
    // Insertar 3 canciones funcionales (reproducibles)
    await queryInterface.bulkInsert('songs', [
      {
        id: 1,
        title: 'DADDY YANKEE || BZRP Music Sessions #0/66',
        artist: 'Bizarrap, Daddy Yankee',
        duration: 160,
        coverUrl: 'https://img.youtube.com/vi/qNw8ejrI0nM/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=qNw8ejrI0nM',
        youtubeId: 'qNw8ejrI0nM',
        isExample: 0, // No es ejemplo, es reproducible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        title: 'She Don\'t Give a FO',
        artist: 'Duki, Khea',
        duration: 230,
        coverUrl: 'https://img.youtube.com/vi/W0yp3rSfx3I/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=W0yp3rSfx3I',
        youtubeId: 'W0yp3rSfx3I',
        isExample: 0, // No es ejemplo, es reproducible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        title: 'Tu Falta De Querer',
        artist: 'Mon Laferte',
        duration: 279,
        coverUrl: 'https://img.youtube.com/vi/WT-VE9OyAJk/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=WT-VE9OyAJk',
        youtubeId: 'WT-VE9OyAJk',
        isExample: 0, // No es ejemplo, es reproducible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // 3 podcasts como ejemplos (no reproducibles pero agregables a favoritos)
      {
        id: 4,
        title: 'Casos de Reencarnación y Vidas Pasadas: ¿La Iglesia nos Mintió?',
        artist: 'Podcast Extra Anormal',
        duration: 5085, // Duración real del podcast
        coverUrl: 'https://img.youtube.com/vi/Gx4kOQ3fU-8/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=Gx4kOQ3fU-8',
        youtubeId: 'Gx4kOQ3fU-8',
        isExample: 1, // Es ejemplo, no reproducible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        title: 'MI MADRE 4BUSÓ DE MI (CON: MARCELA GAVIRIA) I Vos podés el podcast - EP 196',
        artist: 'VOS PODÉS, EL PODCAST!',
        duration: 5785, // Duración real del podcast
        coverUrl: 'https://img.youtube.com/vi/eFQbVvbBr84/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=eFQbVvbBr84',
        youtubeId: 'eFQbVvbBr84',
        isExample: 1, // Es ejemplo, no reproducible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        title: 'MI HERMANO YEFERSON ME SALVÓ LA VIDA (CON CINTIA COSSIO) I Vos podés el podcast - EP 204',
        artist: 'VOS PODÉS, EL PODCAST!',
        duration: 5111, // Duración real del podcast
        coverUrl: 'https://img.youtube.com/vi/zFL7xHCszJA/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=zFL7xHCszJA',
        youtubeId: 'zFL7xHCszJA',
        isExample: 1, // Es ejemplo, no reproducible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('songs', null, {});
  },
};

