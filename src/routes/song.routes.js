const express = require('express');
const router = express.Router();
const songController = require('../controller/song.controller');

// Rutas públicas (no requieren autenticación por ahora)
// Puedes agregar autenticación más adelante si lo necesitas
router.get('/', songController.getAllSongs);
router.get('/:id', songController.getSongById);

module.exports = router;
