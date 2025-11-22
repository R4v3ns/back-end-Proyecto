const { Song } = require('../models');

// Obtener todas las canciones
exports.getAllSongs = async (req, res) => {
  try {
    const songs = await Song.findAll({
      order: [['createdAt', 'DESC']],
    });
    
    res.json({
      ok: true,
      songs: songs,
    });
  } catch (err) {
    console.error('Error getting all songs:', err);
    res.status(500).json({ 
      ok: false,
      error: err.message || 'Error al obtener las canciones' 
    });
  }
};

// Obtener una canción por ID
exports.getSongById = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findByPk(id);
    
    if (!song) {
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada',
      });
    }
    
    res.json({
      ok: true,
      song: song,
    });
  } catch (err) {
    console.error(`Error getting song ${req.params.id}:`, err);
    res.status(500).json({ 
      ok: false,
      error: err.message || 'Error al obtener la canción' 
    });
  }
};
