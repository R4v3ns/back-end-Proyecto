const express = require('express');
const router = express.Router();
const queueController = require('../controller/queue.controller');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/queue - Obtener cola del usuario
router.get('/', queueController.getQueue);

// POST /api/queue - Agregar canción a la cola
router.post('/', queueController.addToQueue);

// POST /api/queue/multiple - Agregar múltiples canciones
router.post('/multiple', queueController.addMultipleToQueue);

// DELETE /api/queue - Eliminar canciones o limpiar cola
router.delete('/', queueController.removeFromQueue);

// PUT /api/queue/reorder - Reordenar cola
router.put('/reorder', queueController.reorderQueue);

module.exports = router;

