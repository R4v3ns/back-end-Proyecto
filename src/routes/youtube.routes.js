const express = require('express');
const router = express.Router();
const songController = require('../controller/song.controller');

// Ruta para convertir YouTube a audio (formato esperado por el frontend)
router.get('/audio/:id', songController.getYouTubeAudio);

module.exports = router;


