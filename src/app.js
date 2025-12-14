require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
// Configuración de CORS para permitir el frontend (Opción 1: Permitir todos los orígenes de Expo - Recomendado para desarrollo)
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Permitir localhost en cualquier puerto
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Permitir todos los dominios de Expo
    if (origin.includes('.exp.direct') || origin.includes('.expo.dev')) {
      return callback(null, true);
    }
    
    // Permitir el origen específico de desarrollo
    if (origin === 'http://localhost:5173') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (audio e imágenes)
// Asegúrate de crear la carpeta uploads en la raíz del proyecto
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    status: 'OK'
  });
});

// Endpoint de configuración para el frontend
app.get('/api/config', (req, res) => {
  const host = req.get('host') || 'localhost:8080';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;
  
  res.json({
    ok: true,
    apiBaseUrl: baseUrl,
    endpoints: {
      users: `${baseUrl}/api/users`,
      songs: `${baseUrl}/songs`,
      library: `${baseUrl}/api/library`,
      youtube: `${baseUrl}/api/youtube`,
      uploads: `${baseUrl}/uploads`
    },
    version: '1.0.0'
  });
});

// Rutas de la API
const userRoutes = require('./routes/user.routes');
const songRoutes = require('./routes/song.routes');
const libraryRoutes = require('./routes/library.routes');
const youtubeRoutes = require('./routes/youtube.routes');
const queueRoutes = require('./routes/queue.routes');

app.use('/api/users', userRoutes);
app.use('/songs', songRoutes); // El frontend espera /songs, no /api/songs
app.use('/api/library', libraryRoutes); // Módulo de biblioteca (playlists y likes)
app.use('/api/youtube', youtubeRoutes); // Conversión de YouTube a audio
app.use('/api/queue', queueRoutes); // Gestión de cola de reproducción

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
// Escuchar en todas las interfaces (0.0.0.0) para permitir conexiones desde dispositivos móviles
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Servidor accesible desde la red en http://192.168.0.21:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

