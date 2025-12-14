const { Playlist, Song, Like, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// BIB-01: Crear playlist
exports.createPlaylist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, coverUrl, isPublic } = req.body;

    // Validar nombre
    if (!name || name.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'El nombre de la playlist es requerido',
        field: 'name'
      });
    }

    const playlist = await Playlist.create({
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      description: description ? description.trim() : null,
      coverUrl: coverUrl || null,
      isPublic: isPublic === true || isPublic === 'true' || isPublic === 1,
    });

    res.status(201).json({
      ok: true,
      message: 'Playlist creada exitosamente',
      playlist
    });
  } catch (err) {
    console.error('Error creating playlist:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al crear la playlist'
    });
  }
};

// BIB-01: Obtener playlists del usuario
exports.getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includePublic } = req.query;

    const whereClause = { userId };
    if (includePublic === 'true') {
      // Incluir también playlists públicas de otros usuarios
      delete whereClause.userId;
      whereClause[Op.or] = [
        { userId },
        { isPublic: true }
      ];
    }

    const playlists = await Playlist.findAll({
      where: whereClause,
      include: [{
        model: Song,
        as: 'songs',
        through: {
          attributes: ['position', 'addedAt']
        },
        attributes: ['id', 'title', 'artist', 'duration', 'coverUrl', 'audioUrl']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Formatear respuesta con conteo de canciones
    const formattedPlaylists = playlists.map(playlist => {
      const playlistObj = playlist.toJSON();
      return {
        ...playlistObj,
        songCount: playlistObj.songs ? playlistObj.songs.length : 0
      };
    });

    res.json({
      ok: true,
      playlists: formattedPlaylists,
      total: formattedPlaylists.length
    });
  } catch (err) {
    console.error('Error getting user playlists:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener las playlists'
    });
  }
};

// BIB-01: Obtener playlist por ID
exports.getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const playlist = await Playlist.findOne({
      where: { id },
      include: [{
        model: Song,
        as: 'songs',
        through: {
          attributes: ['position', 'addedAt']
        },
        order: [['playlist_songs', 'position', 'ASC']],
        attributes: ['id', 'title', 'artist', 'album', 'duration', 'coverUrl', 'audioUrl']
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
      }]
    });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: 'Playlist no encontrada'
      });
    }

    // Verificar que el usuario tenga acceso (es suya o es pública)
    if (playlist.userId !== userId && !playlist.isPublic) {
      return res.status(403).json({
        ok: false,
        error: 'No tienes acceso a esta playlist'
      });
    }

    const playlistObj = playlist.toJSON();
    res.json({
      ok: true,
      playlist: {
        ...playlistObj,
        songCount: playlistObj.songs ? playlistObj.songs.length : 0
      }
    });
  } catch (err) {
    console.error('Error getting playlist:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener la playlist'
    });
  }
};

// BIB-01: Actualizar playlist
exports.updatePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, coverUrl, isPublic } = req.body;

    const playlist = await Playlist.findOne({ where: { id, userId } });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: 'Playlist no encontrada'
      });
    }

    // Actualizar campos
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          ok: false,
          error: 'El nombre de la playlist no puede estar vacío',
          field: 'name'
        });
      }
      playlist.name = name.trim();
    }
    if (description !== undefined) {
      playlist.description = description ? description.trim() : null;
    }
    if (coverUrl !== undefined) {
      playlist.coverUrl = coverUrl || null;
    }
    if (isPublic !== undefined) {
      playlist.isPublic = isPublic === true || isPublic === 'true' || isPublic === 1;
    }

    await playlist.save();

    res.json({
      ok: true,
      message: 'Playlist actualizada exitosamente',
      playlist
    });
  } catch (err) {
    console.error('Error updating playlist:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al actualizar la playlist'
    });
  }
};

// BIB-01: Eliminar playlist
exports.deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const playlist = await Playlist.findOne({ where: { id, userId } });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: 'Playlist no encontrada'
      });
    }

    await playlist.destroy();

    res.json({
      ok: true,
      message: 'Playlist eliminada exitosamente'
    });
  } catch (err) {
    console.error('Error deleting playlist:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al eliminar la playlist'
    });
  }
};

// BIB-02: Agregar canción a playlist
exports.addSongToPlaylist = async (req, res) => {
  try {
    const { id } = req.params; // playlistId
    const { songId } = req.body;
    const userId = req.user.id;

    // Validar que la playlist exista y pertenezca al usuario
    const playlist = await Playlist.findOne({ where: { id, userId } });
    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: 'Playlist no encontrada'
      });
    }

    // Validar que la canción exista
    const song = await Song.findByPk(songId);
    if (!song) {
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada'
      });
    }

    // Verificar si la canción ya está en la playlist usando query directo
    const sequelize = playlist.sequelize;
    const [existing] = await sequelize.query(
      `SELECT id FROM playlist_songs WHERE playlistId = :playlistId AND songId = :songId`,
      {
        replacements: { playlistId: id, songId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: 'La canción ya está en la playlist'
      });
    }

    // Obtener la posición máxima actual usando query directo
    const [results] = await sequelize.query(
      `SELECT MAX(position) as maxPosition FROM playlist_songs WHERE playlistId = :playlistId`,
      {
        replacements: { playlistId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );
    const maxPosition = results?.maxPosition !== null ? results.maxPosition : -1;

    // Agregar canción a la playlist
    await playlist.addSong(song, {
      through: {
        position: maxPosition + 1,
        addedAt: new Date()
      }
    });

    res.json({
      ok: true,
      message: 'Canción agregada a la playlist exitosamente'
    });
  } catch (err) {
    console.error('Error adding song to playlist:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al agregar la canción a la playlist'
    });
  }
};

// BIB-02: Quitar canción de playlist
exports.removeSongFromPlaylist = async (req, res) => {
  try {
    const { id, songId } = req.params; // playlistId y songId
    const userId = req.user.id;

    // Validar que la playlist exista y pertenezca al usuario
    const playlist = await Playlist.findOne({ where: { id, userId } });
    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: 'Playlist no encontrada'
      });
    }

    // Validar que la canción exista
    const song = await Song.findByPk(songId);
    if (!song) {
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada'
      });
    }

    // Quitar canción de la playlist
    await playlist.removeSong(song);

    res.json({
      ok: true,
      message: 'Canción eliminada de la playlist exitosamente'
    });
  } catch (err) {
    console.error('Error removing song from playlist:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al eliminar la canción de la playlist'
    });
  }
};

// BIB-02: Reordenar canciones en playlist
exports.reorderPlaylistSongs = async (req, res) => {
  try {
    const { id } = req.params; // playlistId
    const { songIds } = req.body; // Array de IDs en el nuevo orden
    const userId = req.user.id;

    if (!Array.isArray(songIds)) {
      return res.status(400).json({
        ok: false,
        error: 'songIds debe ser un array',
        field: 'songIds'
      });
    }

    // Validar que la playlist exista y pertenezca al usuario
    const playlist = await Playlist.findOne({ where: { id, userId } });
    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: 'Playlist no encontrada'
      });
    }

    // Actualizar posiciones usando raw query para mejor rendimiento
    const sequelize = playlist.sequelize;
    for (let i = 0; i < songIds.length; i++) {
      await sequelize.query(
        `UPDATE playlist_songs SET position = :position WHERE playlistId = :playlistId AND songId = :songId`,
        {
          replacements: { position: i, playlistId: id, songId: songIds[i] },
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }

    res.json({
      ok: true,
      message: 'Orden de canciones actualizado exitosamente'
    });
  } catch (err) {
    console.error('Error reordering playlist songs:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al reordenar las canciones'
    });
  }
};

// BIB-03: Dar like a canción
exports.likeSong = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({
        ok: false,
        error: 'El ID de la canción es requerido',
        field: 'songId'
      });
    }

    // Convertir songId a número si viene como string
    const songIdNum = typeof songId === 'string' ? parseInt(songId, 10) : songId;
    if (isNaN(songIdNum)) {
      return res.status(400).json({
        ok: false,
        error: 'El ID de la canción debe ser un número válido',
        field: 'songId'
      });
    }

    console.log(`🔍 likeSong - Usuario: ${userId}, Buscando canción con ID: ${songIdNum}`);

    // Validar que la canción exista
    const song = await Song.findByPk(songIdNum);
    if (!song) {
      console.log(`❌ likeSong - Canción con ID ${songIdNum} no encontrada en la base de datos`);
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada',
        songId: songIdNum
      });
    }

    console.log(`✅ likeSong - Canción encontrada: "${song.title}" por ${song.artist}`);

    // Verificar si ya tiene like
    const existingLike = await Like.findOne({ where: { userId, songId: songIdNum } });
    if (existingLike) {
      console.log(`⚠️ likeSong - El usuario ya tiene like en esta canción`);
      return res.status(409).json({
        ok: false,
        error: 'Ya has dado like a esta canción'
      });
    }

    // Crear like
    const newLike = await Like.create({ userId, songId: songIdNum });
    console.log(`✅ likeSong - Like creado exitosamente (ID: ${newLike.id}) para canción ${songIdNum}`);

    // Verificar que se guardó correctamente
    const verifyLike = await Like.findByPk(newLike.id);
    if (!verifyLike) {
      console.error(`❌ likeSong - Error: El like no se guardó correctamente`);
      return res.status(500).json({
        ok: false,
        error: 'Error al guardar el like en la base de datos'
      });
    }

    res.status(201).json({
      ok: true,
      message: `"${song.title}" agregada a favoritos exitosamente`,
      songId: songIdNum,
      songTitle: song.title,
      songArtist: song.artist
    });
  } catch (err) {
    console.error('❌ Error liking song:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al dar like a la canción'
    });
  }
};

// BIB-03: Dar like a canción (con songId en la URL)
exports.likeSongById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({
        ok: false,
        error: 'El ID de la canción es requerido',
        field: 'songId'
      });
    }

    // Convertir songId a número (viene como string desde la URL)
    const songIdNum = parseInt(songId, 10);
    if (isNaN(songIdNum)) {
      return res.status(400).json({
        ok: false,
        error: 'El ID de la canción debe ser un número válido',
        field: 'songId'
      });
    }

    console.log(`🔍 likeSongById - Buscando canción con ID: ${songIdNum} (tipo: ${typeof songIdNum})`);

    // Validar que la canción exista
    const song = await Song.findByPk(songIdNum);
    if (!song) {
      console.log(`❌ likeSongById - Canción con ID ${songIdNum} no encontrada`);
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada',
        songId: songIdNum
      });
    }

    console.log(`✅ likeSongById - Canción encontrada: "${song.title}" por ${song.artist}`);

    // Verificar si ya tiene like (usar songIdNum para consistencia)
    const existingLike = await Like.findOne({ where: { userId, songId: songIdNum } });
    if (existingLike) {
      console.log(`⚠️ likeSongById - El usuario ${userId} ya tiene like en canción ${songIdNum}`);
      return res.status(409).json({
        ok: false,
        error: 'Ya has dado like a esta canción',
        message: `Ya has agregado "${song.title}" a tus favoritos`
      });
    }

    // Crear like usando songIdNum
    const newLike = await Like.create({ userId, songId: songIdNum });
    console.log(`✅ likeSongById - Like creado exitosamente (ID: ${newLike.id}) para canción ${songIdNum}`);

    // Verificar que se guardó correctamente
    const verifyLike = await Like.findByPk(newLike.id);
    if (!verifyLike) {
      console.error(`❌ likeSongById - Error: El like no se guardó correctamente`);
      return res.status(500).json({
        ok: false,
        error: 'Error al guardar el like en la base de datos'
      });
    }

    res.status(201).json({
      ok: true,
      message: `"${song.title}" agregada a favoritos exitosamente`,
      songId: songIdNum,
      songTitle: song.title,
      songArtist: song.artist
    });
  } catch (err) {
    console.error('Error liking song by ID:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al dar like a la canción'
    });
  }
};

// BIB-03: Quitar like de canción
exports.unlikeSong = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.params;

    if (!songId) {
      return res.status(400).json({
        ok: false,
        error: 'El ID de la canción es requerido',
        field: 'songId'
      });
    }

    // Convertir songId a número
    const songIdNum = parseInt(songId, 10);
    if (isNaN(songIdNum)) {
      return res.status(400).json({
        ok: false,
        error: 'El ID de la canción debe ser un número válido',
        field: 'songId'
      });
    }

    console.log(`🔍 unlikeSong - Usuario: ${userId}, Buscando like para canción: ${songIdNum}`);

    // Validar que la canción exista
    const song = await Song.findByPk(songIdNum);
    if (!song) {
      console.log(`❌ unlikeSong - Canción con ID ${songIdNum} no encontrada`);
      return res.status(404).json({
        ok: false,
        error: 'Canción no encontrada',
        songId: songIdNum
      });
    }

    // Buscar el like
    const like = await Like.findOne({ where: { userId, songId: songIdNum } });

    if (!like) {
      console.log(`⚠️ unlikeSong - El usuario ${userId} no tiene like en canción ${songIdNum}`);
      return res.status(404).json({
        ok: false,
        error: 'No has dado like a esta canción',
        message: `"${song.title}" no está en tus favoritos`
      });
    }

    console.log(`✅ unlikeSong - Like encontrado (ID: ${like.id}), eliminando...`);
    
    // Guardar información antes de eliminar para el mensaje
    const songTitle = song.title;
    const songArtist = song.artist;
    
    // Eliminar el like
    await like.destroy();
    
    // Verificar que se eliminó correctamente
    const verifyDelete = await Like.findByPk(like.id);
    if (verifyDelete) {
      console.error(`❌ unlikeSong - Error: El like no se eliminó correctamente`);
      return res.status(500).json({
        ok: false,
        error: 'Error al eliminar el like de la base de datos'
      });
    }

    console.log(`✅ unlikeSong - Like eliminado exitosamente`);

    res.json({
      ok: true,
      message: `"${songTitle}" eliminada de favoritos exitosamente`,
      songId: songIdNum,
      songTitle: songTitle,
      songArtist: songArtist
    });
  } catch (err) {
    console.error('❌ Error unliking song:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al quitar el like'
    });
  }
};

// BIB-03: Verificar si una canción tiene like
exports.checkLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { songId } = req.params;

    const like = await Like.findOne({ where: { userId, songId } });

    res.json({
      ok: true,
      isLiked: !!like
    });
  } catch (err) {
    console.error('Error checking like:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al verificar el like'
    });
  }
};

// BIB-03: Obtener canciones con like del usuario
exports.getLikedSongs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const likes = await Like.findAll({
      where: { userId },
      include: [{
        model: Song,
        as: 'song',
        attributes: ['id', 'title', 'artist', 'album', 'duration', 'coverUrl', 'audioUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const songs = likes.map(like => like.song).filter(Boolean);

    res.json({
      ok: true,
      songs,
      total: songs.length
    });
  } catch (err) {
    console.error('Error getting liked songs:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener las canciones con like'
    });
  }
};

