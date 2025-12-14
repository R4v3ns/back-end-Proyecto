const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';

// Middleware de autenticación JWT
const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Authenticate middleware - Method:', req.method, 'Path:', req.path);
    
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token no proporcionado');
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7); // Remover 'Bearer ' del inicio
    console.log('🔐 Token recibido:', token.substring(0, 20) + '...');

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token válido - User ID:', decoded.id);

    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario autenticado:', user.email);
    
    // Agregar el usuario al request
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Error en autenticación:', err.name, err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Error en la autenticación' });
  }
};

module.exports = { authenticate };

