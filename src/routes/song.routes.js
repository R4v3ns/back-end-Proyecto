const express = require('express');
const router = express.Router();
const songController = require('../controller/song.controller');
const { authenticate } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.get('/featured', songController.getFeaturedSongs); // Debe ir antes de /:id para evitar conflictos
router.get('/', songController.getSongs);
router.get('/:id', songController.getSongById);

// Rutas protegidas (requieren autenticación)
router.post('/', authenticate, songController.createSong);
router.put('/:id', authenticate, songController.updateSong);
router.delete('/:id', authenticate, songController.deleteSong);

module.exports = router;

