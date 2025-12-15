# Proyecto Back-End

API REST desarrollada con Node.js y Express para la gestión de usuarios, canciones, biblioteca personal y cola de reproducción. Incluye autenticación JWT, verificación de email y teléfono, gestión de contenido multimedia, conversión de YouTube a audio, y sistema completo de reproducción.

## Características

- **Autenticación y Autorización**
  - Registro de usuarios con email o teléfono
  - Verificación de email y teléfono
  - Autenticación JWT
  - Gestión de sesiones (login/logout)

- **Gestión de Usuarios**
  - Perfil de usuario
  - Preferencias de usuario
  - Planes de suscripción
  - Cambio de contraseña

- **Catálogo de Canciones**
  - Exploración de catálogo (destacadas, populares, recientes)
  - Búsqueda avanzada de canciones
  - Detalles de artista y álbum
  - Artistas y álbumes populares
  - Listado completo de canciones
  - Almacenamiento de archivos de audio e imágenes
  - Soporte para podcasts

- **Biblioteca Personal**
  - Gestión de playlists (crear, editar, eliminar)
  - Agregar/quitar canciones de playlists
  - Reordenar canciones en playlists
  - Sistema de likes (dar like, quitar like, verificar)
  - Obtener canciones con like

- **Cola de Reproducción**
  - Gestión de cola de reproducción por usuario
  - Agregar canciones individuales o múltiples
  - Reordenar cola
  - Control de reproducción (canción actual, posición, estado)
  - Modos de reproducción (shuffle, repeat)

- **Conversión de YouTube**
  - Conversión de videos de YouTube a audio
  - Descarga y almacenamiento de archivos de audio

- **Seguridad**
  - Contraseñas encriptadas con bcrypt
  - Tokens JWT con expiración
  - Validación de datos de entrada
  - CORS configurado para desarrollo y aplicaciones móviles (Expo)

## Requisitos

- Node.js (v14 o superior)
- npm
- Base de datos SQLite (incluida en el proyecto)
- yt-dlp (opcional, se descarga automáticamente con yt-dlp-wrap)

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/R4v3ns/back-end-Proyecto.git
   ```

2. Ingresa a la carpeta del proyecto:
   ```bash
   cd back-end-Proyecto
   ```

3. Instala las dependencias:
   ```bash
   npm install
   ```

4. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```env
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=tu_secreto_jwt_aqui
   APP_NAME=Mi Aplicación
   ```
   Nota: Asegúrate de usar un JWT_SECRET seguro en producción.

5. Crea las carpetas para archivos estáticos:
   ```bash
   mkdir -p uploads/audio uploads/images
   ```

6. Ejecuta las migraciones de la base de datos:
   ```bash
   npm run db:migrate:up
   ```

## Ejecución

### Desarrollo
```bash
npm run dev
```
El servidor se iniciará en `http://localhost:8080` (o el puerto configurado en `.env`).

### Producción
```bash
npm start
```

## Endpoints de la API

### Autenticación y Registro

#### Registro
- `POST /api/users/register` - Registro básico (compatibilidad)
- `POST /api/users/register/email` - Registro con email
- `POST /api/users/register/phone` - Registro con teléfono

#### Verificación
- `POST /api/users/verify-email` - Verificar email
- `POST /api/users/resend-email-verification` - Reenviar código de verificación de email
- `POST /api/users/verify-phone` - Verificar teléfono
- `POST /api/users/resend-phone-verification` - Reenviar código de verificación de teléfono

#### Login/Logout
- `POST /api/users/login` - Iniciar sesión
  - Body: `{ email, password }` o `{ phone, password }`
  - Retorna: token JWT, información del usuario
- `POST /api/users/logout` - Cerrar sesión

### Gestión de Perfil

- `GET /api/users/me` - Obtener perfil del usuario actual (requiere autenticación)
- `GET /api/users/profile` - Obtener perfil del usuario actual (requiere autenticación)
- `PUT /api/users/profile` - Actualizar perfil (requiere autenticación)
- `POST /api/users/change-password` - Cambiar contraseña (requiere autenticación)

### Preferencias y Planes

- `GET /api/users/preferences` - Ver preferencias (requiere autenticación)
- `PUT /api/users/preferences` - Actualizar preferencias (requiere autenticación)
- `GET /api/users/plan` - Ver plan actual (requiere autenticación)
- `PUT /api/users/plan` - Actualizar plan (requiere autenticación)

### Catálogo de Canciones

#### Exploración
- `GET /songs/featured` - Obtener canciones destacadas
- `GET /songs/popular` - Obtener canciones populares
- `GET /songs/recent` - Obtener canciones recientes
- `GET /songs/podcasts` - Obtener podcasts (canciones con isExample: true)
- `GET /songs/artists/popular` - Obtener artistas populares
- `GET /songs/albums/popular` - Obtener álbumes populares

#### Búsqueda
- `GET /songs/search` - Búsqueda general de canciones
  - Query params: `q` (término de búsqueda), `type` (song, artist, album)

#### Detalles
- `GET /songs/artist/:artistName` - Obtener detalles de un artista
- `GET /songs/album/:albumName` - Obtener detalles de un álbum
- `GET /songs/:id` - Obtener una canción por ID
- `GET /songs` - Obtener todas las canciones

### Biblioteca Personal (requiere autenticación)

#### Playlists
- `POST /api/library/playlists` - Crear playlist
- `GET /api/library/playlists` - Obtener playlists del usuario
- `GET /api/library/playlists/:id` - Obtener playlist por ID
- `PUT /api/library/playlists/:id` - Actualizar playlist
- `DELETE /api/library/playlists/:id` - Eliminar playlist

#### Canciones en Playlists
- `POST /api/library/playlists/:id/songs` - Agregar canción a playlist
- `DELETE /api/library/playlists/:id/songs/:songId` - Quitar canción de playlist
- `PUT /api/library/playlists/:id/songs/reorder` - Reordenar canciones en playlist

#### Sistema de Likes
- `POST /api/library/likes` - Dar like a una canción
- `DELETE /api/library/likes/:songId` - Quitar like de una canción
- `GET /api/library/likes/:songId` - Verificar si una canción tiene like
- `GET /api/library/likes` - Obtener todas las canciones con like

#### Rutas Alternativas (compatibilidad)
- `POST /api/library/liked-songs/:songId` - Dar like por ID en URL
- `POST /api/library/liked-songs` - Dar like (con songId en body)
- `DELETE /api/library/liked-songs/:songId` - Quitar like
- `GET /api/library/liked-songs` - Obtener canciones con like
- `POST /api/users/liked-songs/:songId` - Dar like (alias en ruta de usuarios)
- `POST /api/users/liked-songs` - Dar like (alias en ruta de usuarios)
- `DELETE /api/users/liked-songs/:songId` - Quitar like (alias en ruta de usuarios)
- `GET /api/users/liked-songs` - Obtener canciones con like (alias en ruta de usuarios)

### Cola de Reproducción (requiere autenticación)

- `GET /api/queue` - Obtener cola del usuario
- `POST /api/queue` - Agregar canción a la cola
- `POST /api/queue/multiple` - Agregar múltiples canciones a la cola
- `DELETE /api/queue` - Eliminar canciones o limpiar cola
- `PUT /api/queue/reorder` - Reordenar cola

### Conversión de YouTube

- `GET /api/youtube/audio/:id` - Convertir video de YouTube a audio
  - Descarga el video y lo convierte a formato de audio
  - Almacena el archivo en `uploads/audio/`

### Archivos Estáticos

- `GET /uploads/audio/:filename` - Acceder a archivos de audio
- `GET /uploads/images/:filename` - Acceder a imágenes

### Configuración

- `GET /api/config` - Obtener configuración del API (URLs base y endpoints)
  - Retorna: URLs base del API y todos los endpoints disponibles
  - Útil para el frontend para detectar automáticamente la URL del backend

## Modelos de Base de Datos

El proyecto utiliza Sequelize ORM con SQLite y cuenta con los siguientes modelos:

- **User** - Usuarios del sistema
  - Información de perfil, autenticación, preferencias y planes

- **Song** - Canciones del catálogo
  - Metadatos de canciones (título, artista, álbum, duración, etc.)
  - URLs de audio e imágenes
  - Campos de catálogo (género, año, etc.)
  - Soporte para podcasts (campo `isExample`)

- **Playlist** - Playlists de usuarios
  - Nombre, descripción, portada
  - Visibilidad (pública/privada)
  - Relación many-to-many con canciones

- **Like** - Sistema de likes
  - Relación entre usuarios y canciones

- **Queue** - Cola de reproducción por usuario
  - Canción actual y posición
  - Estado de reproducción (playing, shuffle, repeat)
  - Orden de canciones en la cola

- **Podcast** - Podcasts del catálogo
  - Información del podcast (título, autor, descripción, categoría)
  - Episodios asociados

- **PodcastEpisode** - Episodios de podcasts
  - Información de episodios individuales
  - Relación con el podcast padre

## Autenticación

Todas las rutas protegidas requieren enviar el token JWT en el encabezado `Authorization` con el formato:

```
Authorization: Bearer <token>
```

El token se obtiene al realizar login exitoso y tiene una validez de 12 horas por defecto.

## Estructura del Proyecto

```
back-end-Proyecto/
├── src/
│   ├── app.js
│   ├── config/
│   │   └── config.json
│   ├── controller/
│   │   ├── user.controller.js
│   │   ├── song.controller.js
│   │   ├── library.controller.js
│   │   └── queue.controller.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   │   ├── 20251103182013-user.js
│   │   ├── 20251121152637-create-song.js
│   │   ├── 20251121181855-create-songs.js
│   │   ├── 20251122000000-add-catalog-fields-to-songs.js
│   │   ├── 20251122020000-module-library-playlists.js
│   │   ├── 20251122030000-module-player-queue.js
│   │   ├── 20251122040000-module-podcasts.js
│   │   └── 20251122050000-add-isExample-to-songs.js
│   ├── models/
│   │   ├── index.js
│   │   ├── user.js
│   │   ├── song.js
│   │   ├── playlist.js
│   │   ├── like.js
│   │   ├── queue.js
│   │   └── podcast.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── song.routes.js
│   │   ├── library.routes.js
│   │   ├── queue.routes.js
│   │   └── youtube.routes.js
│   └── seeders/
│       ├── 20251121153000-demo-songs.js
│       └── 20251121182027-demo-songs.js
├── uploads/
│   ├── audio/
│   └── images/
├── database.sqlite
├── package.json
└── README.md
```

## Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **Sequelize** - ORM para base de datos
- **SQLite** - Base de datos relacional
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **bcryptjs** - Encriptación de contraseñas
- **express-validator** - Validación de datos de entrada
- **cors** - Configuración CORS para desarrollo y aplicaciones móviles
- **morgan** - Logger HTTP para desarrollo
- **yt-dlp-wrap** - Conversión de videos de YouTube a audio
- **dotenv** - Gestión de variables de entorno

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm start` - Inicia el servidor en modo producción
- `npm run db:migrate:up` - Ejecuta las migraciones de la base de datos
- `npm run db:migrate:down` - Revierte la última migración

## Seguridad

- Las contraseñas se almacenan encriptadas usando bcrypt
- Los tokens JWT tienen expiración configurable (12 horas por defecto)
- Validación de formato de email y fortaleza de contraseñas
- CORS configurado para permitir:
  - Aplicaciones móviles (Expo)
  - Localhost en cualquier puerto
  - Orígenes específicos de desarrollo
- Manejo de errores centralizado
- Autenticación requerida para rutas protegidas (biblioteca, cola, perfil)
- Validación de datos de entrada en todos los endpoints

## Licencia

ISC

## Autor

R4v3ns

## Repositorio

https://github.com/R4v3ns/back-end-Proyecto
