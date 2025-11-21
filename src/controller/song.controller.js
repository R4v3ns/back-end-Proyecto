const { Song } = require('../models');

// Obtener todas las canciones
exports.getSongs = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    
    const options = {
      order: [['createdAt', 'DESC']],
    };

    // Agregar limit y offset si están presentes
    if (limit) {
      options.limit = parseInt(limit, 10);
    }
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    const songs = await Song.findAll(options);

    res.json({
      ok: true,
      songs,
      count: songs.length,
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener las canciones',
      details: error.message,
    });
  }
};

// Obtener canciones destacadas (featured)
exports.getFeaturedSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6; // Por defecto 6 canciones destacadas
    
    const songs = await Song.findAll({
      order: [['createdAt', 'DESC']],
      limit: limit,
    });

    res.json({
      ok: true,
      songs,
      count: songs.length,
    });
  } catch (error) {
    console.error('Error fetching featured songs:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener las canciones destacadas',
      details: error.message,
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
      song,
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener la canción',
      details: error.message,
    });
  }
};

// Crear una nueva canción
exports.createSong = async (req, res) => {
  try {
    const { title, artist, duration, coverUrl, audioUrl } = req.body;

    // Validaciones básicas
    if (!title || !title.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'El título es requerido',
        field: 'title',
      });
    }

    if (!artist || !artist.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'El artista es requerido',
        field: 'artist',
      });
    }

    if (!coverUrl || !coverUrl.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'La URL de la portada es requerida',
        field: 'coverUrl',
      });
    }

    if (!audioUrl || !audioUrl.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'La URL del audio es requerida',
        field: 'audioUrl',
      });
    }

    const song = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      duration: duration || null,
      coverUrl: coverUrl.trim(),
      audioUrl: audioUrl.trim(),
    });

    res.status(201).json({
      ok: true,
      message: 'Canción creada exitosamente',
      song,
    });
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al crear la canción',
      details: error.message,
    });
  }
};

// Actualizar una canción
exports.updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, duration, coverUrl, audioUrl } = req.body;

    const song = await Song.findByPk(id);

    if (!song) {
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada',
      });
    }

    // Actualizar solo los campos proporcionados
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (artist !== undefined) updates.artist = artist.trim();
    if (duration !== undefined) updates.duration = duration;
    if (coverUrl !== undefined) updates.coverUrl = coverUrl.trim();
    if (audioUrl !== undefined) updates.audioUrl = audioUrl.trim();

    await song.update(updates);

    res.json({
      ok: true,
      message: 'Canción actualizada exitosamente',
      song,
    });
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al actualizar la canción',
      details: error.message,
    });
  }
};

// Eliminar una canción
exports.deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    const song = await Song.findByPk(id);

    if (!song) {
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada',
      });
    }

    await song.destroy();

    res.json({
      ok: true,
      message: 'Canción eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al eliminar la canción',
      details: error.message,
    });
  }
};

