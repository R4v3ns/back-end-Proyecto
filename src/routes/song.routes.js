const express = require('express');
const router = express.Router();
const songController = require('../controller/song.controller');

// CAT-01: Explorar catálogo
router.get('/featured', songController.getFeaturedSongs); // Canciones destacadas
router.get('/popular', songController.getPopularSongs); // Canciones populares
router.get('/recent', songController.getRecentSongs); // Canciones recientes
router.get('/artists/popular', songController.getPopularArtists); // Artistas populares
router.get('/albums/popular', songController.getPopularAlbums); // Álbumes populares

// CAT-02: Búsqueda
router.get('/search', songController.search); // Búsqueda general

// CAT-03: Ver detalles
router.get('/artist/:artistName', songController.getArtistDetails); // Detalles de artista
router.get('/album/:albumName', songController.getAlbumDetails); // Detalles de álbum

// Rutas básicas (mantener compatibilidad)
router.get('/', songController.getAllSongs); // Todas las canciones
router.get('/:id', songController.getSongById); // Canción por ID

module.exports = router;
