/**
 * Ejemplo de configuración del frontend para conectarse al backend
 * 
 * Este archivo muestra cómo configurar el frontend para usar el endpoint
 * de configuración del backend y obtener las URLs automáticamente.
 */

// Opción 1: Configuración dinámica usando el endpoint /api/config
let API_BASE_URL = 'http://localhost:8080'; // Fallback para desarrollo local

/**
 * Inicializa la configuración del API llamando al endpoint de configuración
 * @param {string} backendUrl - URL del backend (puede ser ngrok o localhost)
 */
async function initializeAPIConfig(backendUrl) {
  try {
    const response = await fetch(`${backendUrl}/api/config`);
    const config = await response.json();
    
    if (config.ok) {
      API_BASE_URL = config.apiBaseUrl;
      console.log('✅ API configurada:', API_BASE_URL);
      return config;
    }
  } catch (error) {
    console.warn('⚠️ No se pudo obtener la configuración del backend, usando fallback:', error);
  }
  return null;
}

// Opción 2: Configuración manual (si conoces la URL de ngrok)
// const API_BASE_URL = 'https://tu-ngrok-backend-url.ngrok.io';

/**
 * Ejemplo de uso para reproducir una canción de YouTube
 */
async function playYouTubeSong(youtubeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube/audio/${youtubeId}`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('🎵 Audio URL:', data.audioUrl);
      // Usar data.audioUrl para reproducir
      // audioPlayer.src = data.audioUrl;
      // audioPlayer.play();
      return data.audioUrl;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al obtener audio de YouTube:', error);
    return null;
  }
}

/**
 * Ejemplo de uso para obtener canciones
 */
async function getSongs() {
  try {
    const response = await fetch(`${API_BASE_URL}/songs`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('🎵 Canciones:', data.songs);
      return data.songs;
    }
  } catch (error) {
    console.error('❌ Error al obtener canciones:', error);
    return [];
  }
}

/**
 * Ejemplo de uso para login
 */
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Guardar el token
      localStorage.setItem('token', data.token);
      return data;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al hacer login:', error);
    return null;
  }
}

/**
 * Ejemplo de uso para peticiones autenticadas
 */
async function getProfile() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No hay token de autenticación');
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (data.ok) {
      return data.user;
    } else {
      console.error('❌ Error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    return null;
  }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_BASE_URL,
    initializeAPIConfig,
    playYouTubeSong,
    getSongs,
    login,
    getProfile,
  };
}

// Ejemplo de inicialización al cargar la app
// initializeAPIConfig('https://tu-ngrok-backend-url.ngrok.io');

