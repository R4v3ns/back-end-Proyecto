require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

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

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    status: 'OK'
  });
});

// Rutas de la API
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

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

