const { Song } = require('../models');
const { Op } = require('sequelize');

// Helper: Formatear duración de segundos a MM:SS
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Formatear respuesta de canción
function formatSongResponse(song) {
  const songObj = song.toJSON ? song.toJSON() : song;
  return {
    ...songObj,
    durationFormatted: formatDuration(songObj.duration || 0),
  };
}

// CAT-01: Explorar catálogo - Canciones destacadas
exports.getFeaturedSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const songs = await Song.findAll({
      where: { isFeatured: true },
      order: [['playCount', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      ok: true,
      songs: songs.map(formatSongResponse),
      total: songs.length,
    });
  } catch (err) {
    console.error('Error getting featured songs:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener canciones destacadas',
    });
  }
};

// CAT-01: Explorar catálogo - Canciones populares
exports.getPopularSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const songs = await Song.findAll({
      order: [['playCount', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      ok: true,
      songs: songs.map(formatSongResponse),
      total: songs.length,
    });
  } catch (err) {
    console.error('Error getting popular songs:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener canciones populares',
    });
  }
};

// CAT-01: Explorar catálogo - Canciones recientes
exports.getRecentSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const songs = await Song.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      ok: true,
      songs: songs.map(formatSongResponse),
      total: songs.length,
    });
  } catch (err) {
    console.error('Error getting recent songs:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener canciones recientes',
    });
  }
};

// CAT-01: Explorar catálogo - Artistas populares
exports.getPopularArtists = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Obtener artistas únicos con conteo de canciones y playCount total
    const songs = await Song.findAll({
      attributes: [
        'artist',
        [Song.sequelize.fn('COUNT', Song.sequelize.col('id')), 'songCount'],
        [Song.sequelize.fn('SUM', Song.sequelize.col('playCount')), 'totalPlays'],
      ],
      group: ['artist'],
      order: [[Song.sequelize.literal('totalPlays'), 'DESC']],
      limit,
    });

    const artists = songs.map((song) => ({
      name: song.artist,
      songCount: parseInt(song.get('songCount') || 0),
      totalPlays: parseInt(song.get('totalPlays') || 0),
    }));

    res.json({
      ok: true,
      artists,
      total: artists.length,
    });
  } catch (err) {
    console.error('Error getting popular artists:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener artistas populares',
    });
  }
};

// CAT-01: Explorar catálogo - Álbumes populares
exports.getPopularAlbums = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Obtener álbumes únicos con conteo de canciones
    const albums = await Song.findAll({
      where: {
        album: { [Op.ne]: null },
      },
      attributes: [
        'album',
        'artist',
        [Song.sequelize.fn('COUNT', Song.sequelize.col('id')), 'songCount'],
        [Song.sequelize.fn('SUM', Song.sequelize.col('playCount')), 'totalPlays'],
      ],
      group: ['album', 'artist'],
      order: [[Song.sequelize.literal('totalPlays'), 'DESC']],
      limit,
    });

    const albumsList = albums.map((album) => ({
      name: album.album,
      artist: album.artist,
      songCount: parseInt(album.get('songCount') || 0),
      totalPlays: parseInt(album.get('totalPlays') || 0),
    }));

    res.json({
      ok: true,
      albums: albumsList,
      total: albumsList.length,
    });
  } catch (err) {
    console.error('Error getting popular albums:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener álbumes populares',
    });
  }
};

// CAT-02: Búsqueda de canciones, artistas y álbumes
exports.search = async (req, res) => {
  try {
    const { q, type, limit: limitParam, offset: offsetParam } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'El parámetro de búsqueda "q" es requerido',
      });
    }

    const limit = parseInt(limitParam) || 20;
    const offset = parseInt(offsetParam) || 0;
    const searchTerm = `%${q.trim()}%`;

    let results = {
      songs: [],
      artists: [],
      albums: [],
    };

    // Buscar canciones
    if (!type || type === 'songs' || type === 'all') {
      const songs = await Song.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: searchTerm } },
            { artist: { [Op.like]: searchTerm } },
            { album: { [Op.like]: searchTerm } },
          ],
        },
        order: [['playCount', 'DESC']],
        limit,
        offset,
      });
      results.songs = songs.map(formatSongResponse);
    }

    // Buscar artistas
    if (!type || type === 'artists' || type === 'all') {
      const artists = await Song.findAll({
        where: {
          artist: { [Op.like]: searchTerm },
        },
        attributes: [
          'artist',
          [Song.sequelize.fn('COUNT', Song.sequelize.col('id')), 'songCount'],
        ],
        group: ['artist'],
        limit: limit,
        offset: offset,
      });
      results.artists = artists.map((song) => ({
        name: song.artist,
        songCount: parseInt(song.get('songCount') || 0),
      }));
    }

    // Buscar álbumes
    if (!type || type === 'albums' || type === 'all') {
      const albums = await Song.findAll({
        where: {
          album: { [Op.like]: searchTerm },
        },
        attributes: [
          'album',
          'artist',
          [Song.sequelize.fn('COUNT', Song.sequelize.col('id')), 'songCount'],
        ],
        group: ['album', 'artist'],
        limit: limit,
        offset: offset,
      });
      results.albums = albums.map((album) => ({
        name: album.album,
        artist: album.artist,
        songCount: parseInt(album.get('songCount') || 0),
      }));
    }

    res.json({
      ok: true,
      query: q,
      results,
      total: {
        songs: results.songs.length,
        artists: results.artists.length,
        albums: results.albums.length,
      },
    });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al realizar la búsqueda',
    });
  }
};

// CAT-03: Ver detalles de una canción
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
      song: formatSongResponse(song),
    });
  } catch (err) {
    console.error(`Error getting song ${req.params.id}:`, err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener la canción',
    });
  }
};

// CAT-03: Ver detalles de un artista
exports.getArtistDetails = async (req, res) => {
  try {
    const { artistName } = req.params;
    const decodedArtistName = decodeURIComponent(artistName);

    // Obtener todas las canciones del artista
    const songs = await Song.findAll({
      where: { artist: decodedArtistName },
      order: [['playCount', 'DESC'], ['createdAt', 'DESC']],
    });

    if (songs.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Artista no encontrado',
      });
    }

    // Calcular estadísticas
    const totalSongs = songs.length;
    const totalPlays = songs.reduce((sum, song) => sum + (song.playCount || 0), 0);
    const albums = [...new Set(songs.map((s) => s.album).filter(Boolean))];

    res.json({
      ok: true,
      artist: {
        name: decodedArtistName,
        totalSongs,
        totalPlays,
        albums: albums.length,
        songs: songs.map(formatSongResponse),
      },
    });
  } catch (err) {
    console.error(`Error getting artist ${req.params.artistName}:`, err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener detalles del artista',
    });
  }
};

// CAT-03: Ver detalles de un álbum
exports.getAlbumDetails = async (req, res) => {
  try {
    const { albumName } = req.params;
    const { artist: artistQuery } = req.query;
    const decodedAlbumName = decodeURIComponent(albumName);

    const whereClause = { album: decodedAlbumName };
    if (artistQuery) {
      whereClause.artist = decodeURIComponent(artistQuery);
    }

    const songs = await Song.findAll({
      where: whereClause,
      order: [['title', 'ASC']],
    });

    if (songs.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Álbum no encontrado',
      });
    }

    // Calcular estadísticas
    const totalSongs = songs.length;
    const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    const totalPlays = songs.reduce((sum, song) => sum + (song.playCount || 0), 0);
    const artist = songs[0].artist;
    const releaseDate = songs[0].releaseDate;

    res.json({
      ok: true,
      album: {
        name: decodedAlbumName,
        artist,
        releaseDate,
        totalSongs,
        totalDuration: formatDuration(totalDuration),
        totalPlays,
        songs: songs.map(formatSongResponse),
      },
    });
  } catch (err) {
    console.error(`Error getting album ${req.params.albumName}:`, err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener detalles del álbum',
    });
  }
};

// Obtener todas las canciones (mantener compatibilidad)
exports.getAllSongs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const songs = await Song.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      ok: true,
      songs: songs.map(formatSongResponse),
      total: songs.length,
    });
  } catch (err) {
    console.error('Error getting all songs:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al obtener las canciones',
    });
  }
};
