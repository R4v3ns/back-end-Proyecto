const express = require('express');
const router = express.Router();
const libraryController = require('../controller/library.controller');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// BIB-01: Gestión de playlists
router.post('/playlists', libraryController.createPlaylist); // Crear playlist
router.get('/playlists', libraryController.getUserPlaylists); // Obtener playlists del usuario
router.get('/playlists/:id', libraryController.getPlaylistById); // Obtener playlist por ID
router.put('/playlists/:id', libraryController.updatePlaylist); // Actualizar playlist
router.delete('/playlists/:id', libraryController.deletePlaylist); // Eliminar playlist

// BIB-02: Gestión de canciones en playlists
router.post('/playlists/:id/songs', libraryController.addSongToPlaylist); // Agregar canción
router.delete('/playlists/:id/songs/:songId', libraryController.removeSongFromPlaylist); // Quitar canción
router.put('/playlists/:id/songs/reorder', libraryController.reorderPlaylistSongs); // Reordenar canciones

// BIB-03: Sistema de likes
router.post('/likes', libraryController.likeSong); // Dar like
router.delete('/likes/:songId', libraryController.unlikeSong); // Quitar like
router.get('/likes/:songId', libraryController.checkLike); // Verificar like
router.get('/likes', libraryController.getLikedSongs); // Obtener canciones con like

module.exports = router;


