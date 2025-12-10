# Configuración del Frontend

Este documento explica cómo configurar el frontend para conectarse al backend.

## URL Base del API

El backend expone un endpoint de configuración que el frontend puede usar para obtener la URL base automáticamente:

### Endpoint de Configuración
```
GET /api/config
```

**Respuesta:**
```json
{
  "ok": true,
  "apiBaseUrl": "https://tu-ngrok-url.ngrok.io",
  "endpoints": {
    "users": "https://tu-ngrok-url.ngrok.io/api/users",
    "songs": "https://tu-ngrok-url.ngrok.io/songs",
    "library": "https://tu-ngrok-url.ngrok.io/api/library",
    "youtube": "https://tu-ngrok-url.ngrok.io/api/youtube",
    "uploads": "https://tu-ngrok-url.ngrok.io/uploads"
  },
  "version": "1.0.0"
}
```

## Configuración en el Frontend

### Opción 1: Usar el Endpoint de Configuración (Recomendado)

```javascript
// Al iniciar la app, obtener la configuración
const response = await fetch('https://tu-ngrok-backend-url.ngrok.io/api/config');
const config = await response.json();

// Usar la URL base en todas las peticiones
const API_BASE_URL = config.apiBaseUrl;
```

### Opción 2: Configuración Manual

Si prefieres configurarlo manualmente, usa la URL de ngrok del backend:

```javascript
// En tu archivo de configuración del frontend
const API_BASE_URL = 'https://tu-ngrok-backend-url.ngrok.io';

// Ejemplo de uso
const response = await fetch(`${API_BASE_URL}/songs`);
```

## Endpoints Importantes

### YouTube Audio Conversion
```
GET ${API_BASE_URL}/api/youtube/audio/:youtubeId
```

**Ejemplo:**
```javascript
const youtubeId = 'W0yp3rSfx3I';
const response = await fetch(`${API_BASE_URL}/api/youtube/audio/${youtubeId}`);
const data = await response.json();
// data.audioUrl contiene la URL del audio convertido
```

### Canciones
```
GET ${API_BASE_URL}/songs
GET ${API_BASE_URL}/songs/:id
GET ${API_BASE_URL}/songs/search?q=termino
```

### Usuarios
```
POST ${API_BASE_URL}/api/users/login
GET ${API_BASE_URL}/api/users/profile
PUT ${API_BASE_URL}/api/users/profile
```

## Notas Importantes

1. **HTTPS Required**: Cuando uses ngrok, asegúrate de usar HTTPS en todas las peticiones para evitar errores de Mixed Content.

2. **CORS**: El backend ya está configurado para aceptar peticiones desde dominios `.exp.direct` y `.expo.dev`.

3. **URLs Absolutas**: El backend genera automáticamente URLs absolutas cuando detecta que se accede a través de ngrok (detecta el header `X-Forwarded-Proto`).

## Ejemplo Completo de Integración

```javascript
// config.js
let API_BASE_URL = 'http://localhost:8080'; // Fallback para desarrollo local

// Detectar si estamos en producción/ngrok
if (window.location.hostname.includes('.exp.direct') || 
    window.location.hostname.includes('.expo.dev')) {
  // Obtener la URL del backend desde el endpoint de configuración
  fetch('https://tu-ngrok-backend-url.ngrok.io/api/config')
    .then(res => res.json())
    .then(config => {
      API_BASE_URL = config.apiBaseUrl;
    });
}

export { API_BASE_URL };

// Uso en componentes
import { API_BASE_URL } from './config';

const playYouTubeSong = async (youtubeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube/audio/${youtubeId}`);
    const data = await response.json();
    
    if (data.ok) {
      // Usar data.audioUrl para reproducir
      audioPlayer.src = data.audioUrl;
      audioPlayer.play();
    }
  } catch (error) {
    console.error('Error al obtener audio de YouTube:', error);
  }
};
```

## Solución de Problemas

### Error: Mixed Content
**Problema**: La página está en HTTPS pero intenta cargar recursos HTTP.

**Solución**: Asegúrate de usar la URL HTTPS de ngrok para el backend, no `localhost:8080`.

### Error: CORS
**Problema**: El navegador bloquea las peticiones por CORS.

**Solución**: Verifica que el backend esté configurado para aceptar tu dominio. El backend ya acepta `.exp.direct` y `.expo.dev` por defecto.

### Error: NotSupportedError
**Problema**: No se puede reproducir el audio.

**Solución**: 
1. Asegúrate de usar la URL del endpoint de YouTube (`/api/youtube/audio/:id`) y no la URL directa de YouTube.
2. Verifica que el backend haya convertido correctamente el video a audio.

