const { Queue, Song } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Helper para generar ID único para items de cola
const generateQueueItemId = () => {
  return crypto.randomUUID();
};

// Helper para convertir songIds a formato QueueItem[]
// Genera IDs únicos basados en songId y posición para mantener consistencia
const formatQueueItems = async (songIds, currentIndex = -1) => {
  if (!songIds || songIds.length === 0) {
    return [];
  }

  // Obtener todas las canciones de una vez
  const uniqueSongIds = [...new Set(songIds)]; // Obtener IDs únicos
  const songs = await Song.findAll({
    where: {
      id: {
        [Op.in]: uniqueSongIds
      }
    }
  });

  // Crear un mapa de canciones por ID para acceso rápido
  const songMap = new Map(songs.map(song => [song.id, song.toJSON()]));

  // Formatear a QueueItem[]
  // Usar formato: "songId-posicion" para IDs simples y predecibles
  return songIds.map((songId, index) => {
    const song = songMap.get(songId);
    if (!song) {
      // Si la canción no existe, omitirla (puede haber sido eliminada)
      return null;
    }
    return {
      id: `${songId}-${index}`, // ID simple basado en songId y posición
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        coverUrl: song.coverUrl || '',
        audioUrl: song.audioUrl || '',
        youtubeId: song.youtubeId || undefined,
        isExample: song.isExample || false,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,
      },
      position: index,
      addedAt: new Date().toISOString(), // Por ahora usamos la fecha actual
    };
  }).filter(item => item !== null); // Filtrar items nulos
};

// GET /api/queue - Obtener cola del usuario
exports.getQueue = async (req, res) => {
  try {
    const userId = req.user.id;

    let queue = await Queue.findOne({
      where: { userId }
    });

    // Si no existe cola, crear una vacía
    if (!queue) {
      queue = await Queue.create({
        userId,
        queueOrder: []
      });
    }

    const songIds = queue.queueOrder || [];
    const items = await formatQueueItems(songIds, queue.currentPosition || 0);

    res.json({
      ok: true,
      queue: items,
      currentIndex: queue.currentPosition >= 0 && queue.currentPosition < items.length 
        ? queue.currentPosition 
        : -1
    });
  } catch (err) {
    console.error('Error getting queue:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener la cola'
    });
  }
};

// POST /api/queue - Agregar canción a la cola
exports.addToQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId, position, index } = req.body;

    // Validar songId
    if (!songId || isNaN(Number(songId))) {
      return res.status(400).json({
        ok: false,
        error: 'songId es requerido y debe ser un número'
      });
    }

    // Verificar que la canción existe
    const song = await Song.findByPk(songId);
    if (!song) {
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada'
      });
    }

    // Obtener o crear cola
    let queue = await Queue.findOne({
      where: { userId }
    });

    if (!queue) {
      queue = await Queue.create({
        userId,
        queueOrder: []
      });
    }

    let songIds = [...(queue.queueOrder || [])];

    // Determinar posición de inserción
    let insertIndex;
    if (index !== undefined && index !== null) {
      // Posición específica
      insertIndex = Math.max(0, Math.min(index, songIds.length));
    } else if (position === 'next') {
      // Insertar después de la canción actual (posición 0)
      insertIndex = 0;
    } else {
      // Agregar al final (posición 'end' o por defecto)
      insertIndex = songIds.length;
    }

    // Evitar duplicados (opcional: puedes permitir duplicados si quieres)
    // songIds = songIds.filter(id => id !== songId);

    // Insertar la canción
    songIds.splice(insertIndex, 0, songId);

    // Actualizar cola
    queue.queueOrder = songIds;
    await queue.save();

    // Obtener el item formateado
    const items = await formatQueueItems(songIds);
    const newItem = items[insertIndex];

    res.status(201).json({
      ok: true,
      item: newItem
    });
  } catch (err) {
    console.error('Error adding to queue:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al agregar canción a la cola'
    });
  }
};

// POST /api/queue/multiple - Agregar múltiples canciones
exports.addMultipleToQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songIds: newSongIds, position } = req.body;

    // Validar songIds
    if (!Array.isArray(newSongIds) || newSongIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'songIds es requerido y debe ser un array no vacío'
      });
    }

    // Verificar que todas las canciones existen
    const songs = await Song.findAll({
      where: {
        id: {
          [Op.in]: newSongIds
        }
      }
    });

    if (songs.length !== newSongIds.length) {
      return res.status(404).json({
        ok: false,
        error: 'Una o más canciones no fueron encontradas'
      });
    }

    // Obtener o crear cola
    let queue = await Queue.findOne({
      where: { userId }
    });

    if (!queue) {
      queue = await Queue.create({
        userId,
        queueOrder: []
      });
    }

    let songIds = [...(queue.queueOrder || [])];

    // Determinar posición de inserción
    let insertIndex;
    if (position === 'next') {
      insertIndex = 0;
    } else {
      insertIndex = songIds.length;
    }

    // Insertar canciones
    songIds.splice(insertIndex, 0, ...newSongIds);

    // Actualizar cola
    queue.queueOrder = songIds;
    await queue.save();

    // Obtener items formateados
    const items = await formatQueueItems(songIds);
    const newItems = items.slice(insertIndex, insertIndex + newSongIds.length);

    res.status(201).json({
      ok: true,
      items: newItems
    });
  } catch (err) {
    console.error('Error adding multiple to queue:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al agregar canciones a la cola'
    });
  }
};

// DELETE /api/queue - Eliminar canciones o limpiar cola
exports.removeFromQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Manejar body de forma segura (puede estar vacío o undefined para limpiar cola)
    const body = req.body || {};
    const { itemIds } = body;

    // Obtener cola
    let queue = await Queue.findOne({
      where: { userId }
    });

    if (!queue || !queue.queueOrder || queue.queueOrder.length === 0) {
      return res.status(204).send(); // No content
    }

    // Obtener lista actual de songIds
    let songIds = [...(queue.queueOrder || [])];

    // Si no se especifican itemIds, limpiar toda la cola
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      console.log('🗑️ [removeFromQueue] Limpiando toda la cola (no itemIds especificados)');
      queue.queueOrder = [];
      queue.currentSongId = null;
      queue.currentPosition = 0;
      await queue.save();
      return res.status(204).send();
    }

    // Extraer posiciones de los itemIds
    // El frontend envía itemIds en formato "songId-index" (ej: "123-0", "456-1")
    // Necesitamos encontrar la posición exacta del item en la cola actual
    const positionsToRemove = new Set();
    
    // Obtener la cola actual formateada para encontrar los items exactos
    const currentItems = await formatQueueItems(songIds, -1);
    
    console.log('🔍 [removeFromQueue] ItemIds recibidos:', itemIds);
    console.log('🔍 [removeFromQueue] SongIds actuales:', songIds);
    console.log('🔍 [removeFromQueue] Items formateados:', currentItems.map(item => ({ id: item.id, songId: item.song.id, position: item.position })));
    
    // Para cada itemId, encontrar su posición exacta en la cola
    itemIds.forEach((itemId) => {
      console.log('🔍 [removeFromQueue] Buscando itemId:', itemId);
      
      // Primero intentar buscar por ID exacto en los items formateados
      const itemIndex = currentItems.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        console.log('✅ [removeFromQueue] Item encontrado por ID exacto en posición:', itemIndex);
        positionsToRemove.add(itemIndex);
      } else {
        // Si no se encuentra por ID exacto, intentar parsear el formato "songId-index"
        const match = itemId.match(/^(\d+)-(\d+)$/);
        if (match) {
          const songIdToFind = parseInt(match[1]);
          const expectedIndex = parseInt(match[2]);
          
          console.log('🔍 [removeFromQueue] Parseado songId:', songIdToFind, 'expectedIndex:', expectedIndex);
          
          // Verificar si el índice esperado coincide con el songId en esa posición
          if (expectedIndex >= 0 && expectedIndex < songIds.length && songIds[expectedIndex] === songIdToFind) {
            console.log('✅ [removeFromQueue] Item encontrado por songId-index en posición:', expectedIndex);
            positionsToRemove.add(expectedIndex);
          } else {
            // Si el índice no coincide, buscar todas las ocurrencias del songId
            const indices = [];
            songIds.forEach((sid, idx) => {
              if (sid === songIdToFind) {
                indices.push(idx);
              }
            });
            
            if (indices.length > 0) {
              // Si hay múltiples ocurrencias, usar la que coincida con expectedIndex si está en el rango
              if (expectedIndex >= 0 && expectedIndex < indices.length) {
                console.log('✅ [removeFromQueue] Item encontrado por songId (ocurrencia #' + expectedIndex + ') en posición:', indices[expectedIndex]);
                positionsToRemove.add(indices[expectedIndex]);
              } else {
                // Si no, eliminar la primera ocurrencia
                console.log('✅ [removeFromQueue] Item encontrado por songId (primera ocurrencia) en posición:', indices[0]);
                positionsToRemove.add(indices[0]);
              }
            } else {
              console.log('⚠️ [removeFromQueue] SongId no encontrado en la cola:', songIdToFind);
            }
          }
        } else {
          console.log('⚠️ [removeFromQueue] ItemId no tiene formato válido:', itemId);
        }
      }
    });

    console.log('🎯 [removeFromQueue] Posiciones a eliminar:', Array.from(positionsToRemove));

    if (positionsToRemove.size === 0) {
      return res.status(400).json({
        ok: false,
        error: 'No se encontraron items válidos para eliminar'
      });
    }

    // Eliminar canciones de la cola por posición (de mayor a menor para no afectar índices)
    const sortedPositions = Array.from(positionsToRemove).sort((a, b) => b - a);
    sortedPositions.forEach(pos => {
      if (pos >= 0 && pos < songIds.length) {
        console.log('🗑️ [removeFromQueue] Eliminando posición:', pos, 'songId:', songIds[pos]);
        songIds.splice(pos, 1);
      }
    });

    console.log('✅ [removeFromQueue] SongIds después de eliminar:', songIds);

    // Actualizar cola
    queue.queueOrder = songIds;
    // Ajustar currentPosition si es necesario
    if (queue.currentPosition >= songIds.length) {
      queue.currentPosition = Math.max(0, songIds.length - 1);
    }
    await queue.save();

    res.status(204).send();
  } catch (err) {
    console.error('Error removing from queue:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al eliminar canciones de la cola'
    });
  }
};

// PUT /api/queue/reorder - Reordenar cola
exports.reorderQueue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, newPosition } = req.body;

    // Validar parámetros
    if (!itemId || newPosition === undefined || newPosition === null) {
      return res.status(400).json({
        ok: false,
        error: 'itemId y newPosition son requeridos'
      });
    }

    if (isNaN(Number(newPosition)) || Number(newPosition) < 0) {
      return res.status(400).json({
        ok: false,
        error: 'newPosition debe ser un número mayor o igual a 0'
      });
    }

    // Obtener cola
    let queue = await Queue.findOne({
      where: { userId }
    });

    if (!queue || !queue.queueOrder || queue.queueOrder.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'La cola está vacía'
      });
    }

    // Extraer songId del itemId (formato: "songId-index")
    const match = itemId.match(/^(\d+)-/);
    if (!match) {
      return res.status(400).json({
        ok: false,
        error: 'itemId inválido'
      });
    }

    const songId = parseInt(match[1]);
    let songIds = [...(queue.queueOrder || [])];

    // Encontrar índice actual del songId
    const currentIndex = songIds.indexOf(songId);
    if (currentIndex === -1) {
      return res.status(404).json({
        ok: false,
        error: 'Item no encontrado en la cola'
      });
    }

    // Reordenar: remover del índice actual y insertar en nueva posición
    songIds.splice(currentIndex, 1);
    const insertIndex = Math.min(newPosition, songIds.length);
    songIds.splice(insertIndex, 0, songId);

    // Actualizar cola
    queue.queueOrder = songIds;
    // Ajustar currentPosition si es necesario
    if (queue.currentPosition === currentIndex) {
      queue.currentPosition = insertIndex;
    } else if (queue.currentPosition > currentIndex && queue.currentPosition <= insertIndex) {
      queue.currentPosition--;
    } else if (queue.currentPosition < currentIndex && queue.currentPosition >= insertIndex) {
      queue.currentPosition++;
    }
    await queue.save();

    // Devolver cola actualizada
    const items = await formatQueueItems(songIds, queue.currentPosition);

    res.json({
      ok: true,
      queue: items
    });
  } catch (err) {
    console.error('Error reordering queue:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al reordenar la cola'
    });
  }
};

