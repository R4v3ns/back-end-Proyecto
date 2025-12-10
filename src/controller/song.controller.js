const { Song } = require('../models');
const { Op } = require('sequelize');
const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs');

// Helper: Formatear duración de segundos a MM:SS
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Formatear respuesta de canción
function formatSongResponse(song, req = null) {
  const songObj = song.toJSON ? song.toJSON() : song;
  const formatted = {
    ...songObj,
    durationFormatted: formatDuration(songObj.duration || 0),
  };
  
  // Si hay request, convertir URLs relativas a absolutas
  if (req && songObj.audioUrl && songObj.audioUrl.startsWith('/')) {
    const host = req.get('host') || 'localhost:8080';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    formatted.audioUrl = `${protocol}://${host}${songObj.audioUrl}`;
  }
  
  if (req && songObj.coverUrl && songObj.coverUrl.startsWith('/')) {
    const host = req.get('host') || 'localhost:8080';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    formatted.coverUrl = `${protocol}://${host}${songObj.coverUrl}`;
  }
  
  return formatted;
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
      songs: songs.map(song => formatSongResponse(song, req)),
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
      songs: songs.map(song => formatSongResponse(song, req)),
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
      songs: songs.map(song => formatSongResponse(song, req)),
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
      results.songs = songs.map(song => formatSongResponse(song, req));
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
      song: formatSongResponse(song, req),
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
        songs: songs.map(song => formatSongResponse(song, req)),
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
        songs: songs.map(song => formatSongResponse(song, req)),
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
      songs: songs.map(song => formatSongResponse(song, req)),
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

// Convertir YouTube a audio
exports.getYouTubeAudio = async (req, res) => {
  try {
    // Aceptar tanto 'id' como 'youtubeId' como parámetro
    const youtubeId = req.params.id || req.params.youtubeId;
    
    // Validar YouTube ID (puede ser 11 caracteres o más para shorts)
    if (!youtubeId || youtubeId.length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'YouTube ID inválido',
        field: 'youtubeId'
      });
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const uploadsDir = path.join(__dirname, '../../uploads/audio');
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let outputPath = path.join(uploadsDir, `${youtubeId}.mp3`);
    let outputUrl = `/uploads/audio/${youtubeId}.mp3`;

    // Si el archivo ya existe, devolver la URL directamente
    if (fs.existsSync(outputPath)) {
      const host = req.get('host') || 'localhost:8080';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const fullUrl = `${protocol}://${host}${outputUrl}`;
      
      return res.json({
        ok: true,
        audioUrl: fullUrl,
        cached: true,
        youtubeId
      });
    }

    // Inicializar yt-dlp-wrap
    // Intentar encontrar yt-dlp en diferentes ubicaciones
    let ytDlpPath = null;
    const possiblePaths = [
      '/usr/local/bin/yt-dlp',
      '/opt/homebrew/bin/yt-dlp',
      '/Users/r4v3n/Library/Python/3.9/bin/yt-dlp',
      process.env.PATH?.split(':').map(p => `${p}/yt-dlp`).find(p => {
        try {
          require('fs').accessSync(p);
          return true;
        } catch {
          return false;
        }
      })
    ].filter(Boolean);

    // Buscar yt-dlp en las rutas posibles
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          ytDlpPath = testPath;
          break;
        }
      } catch (e) {
        // Continuar buscando
      }
    }

    let ytDlpWrap;
    try {
      if (ytDlpPath) {
        ytDlpWrap = new YTDlpWrap(ytDlpPath);
        console.log(`[YouTube Audio] Usando yt-dlp en: ${ytDlpPath}`);
      } else {
        // Intentar sin ruta específica, yt-dlp-wrap intentará encontrarlo
        ytDlpWrap = new YTDlpWrap();
      }
    } catch (initError) {
      console.error('[YouTube Audio] Error inicializando yt-dlp-wrap:', initError);
      return res.status(500).json({
        ok: false,
        error: 'Error al inicializar yt-dlp. Asegúrate de que yt-dlp esté instalado en el sistema.',
        message: 'Instala yt-dlp: pip3 install yt-dlp (ya instalado, pero puede necesitar agregar al PATH)'
      });
    }
    
    // Descargar y convertir a audio
    console.log(`[YouTube Audio] Descargando: ${youtubeUrl}`);
    console.log(`[YouTube Audio] Guardando en: ${outputPath}`);
    
    try {
      // Intentar descargar el mejor formato de audio disponible (sin conversión si es posible)
      await ytDlpWrap.execPromise([
        youtubeUrl,
        '-f', 'bestaudio/best', // Mejor audio disponible, o mejor formato si no hay audio directo
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputPath,
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android',
        '--user-agent', 'com.google.android.youtube/19.09.37 (Linux; U; Android 11)'
      ]);
    } catch (downloadError) {
      console.error('[YouTube Audio] Error en descarga:', downloadError.message);
      const errorMsg = downloadError.message || '';
      
      // Si falta ffmpeg, intentar descargar formato directo sin conversión
      if (errorMsg.includes('ffmpeg') || errorMsg.includes('ffprobe')) {
        try {
          console.log('[YouTube Audio] Intentando descargar formato directo sin conversión...');
          await ytDlpWrap.execPromise([
            youtubeUrl,
            '-f', 'bestaudio[ext=m4a]/bestaudio/best', // Formato de audio directo
            '-o', outputPath.replace('.mp3', '.%(ext)s'),
            '--no-playlist',
            '--extractor-args', 'youtube:player_client=android'
          ]);
          
          // Si se descargó en otro formato, renombrar o actualizar la ruta
          const downloadedFiles = fs.readdirSync(uploadsDir).filter(f => f.startsWith(youtubeId));
          if (downloadedFiles.length > 0) {
            const downloadedFile = downloadedFiles[0];
            const finalPath = path.join(uploadsDir, downloadedFile);
            const finalUrl = `/uploads/audio/${downloadedFile}`;
            outputPath = finalPath;
            outputUrl = finalUrl;
          }
        } catch (directError) {
          throw new Error(`Se requiere ffmpeg para convertir el audio. Instala con: brew install ffmpeg (o pip3 install --upgrade yt-dlp). Error: ${directError.message}`);
        }
      } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
        throw new Error('YouTube está bloqueando la descarga. Intenta con otro video o actualiza yt-dlp: pip3 install --upgrade yt-dlp');
      } else {
        throw new Error(`No se pudo descargar el audio: ${errorMsg}`);
      }
    }

    // Verificar que el archivo se creó
    if (!fs.existsSync(outputPath)) {
      throw new Error('No se pudo crear el archivo de audio');
    }

    // Construir la URL completa
    const host = req.get('host') || 'localhost:8080';
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const fullUrl = `${protocol}://${host}${outputUrl}`;

    console.log(`[YouTube Audio] Conversión exitosa: ${fullUrl}`);

    res.json({
      ok: true,
      audioUrl: fullUrl,
      cached: false,
      youtubeId
    });
  } catch (err) {
    console.error('[YouTube Audio] Error:', err.message);
    res.status(500).json({
      ok: false,
      error: err.message || 'Error al convertir YouTube a audio',
      message: 'Asegúrate de que yt-dlp esté instalado. En macOS: brew install yt-dlp'
    });
  }
};
