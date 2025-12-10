# Proyecto Back-End

API REST desarrollada con Node.js y Express para la gestión de usuarios y canciones. Incluye autenticación JWT, verificación de email y teléfono, y gestión de contenido multimedia.

## Características

- Autenticación y Autorización
  - Registro de usuarios con email o teléfono
  - Verificación de email y teléfono
  - Autenticación JWT
  - Gestión de sesiones (login/logout)

- Gestión de Usuarios
  - Perfil de usuario
  - Preferencias de usuario
  - Planes de suscripción
  - Cambio de contraseña

- Gestión de Canciones
  - Listado de canciones
  - Búsqueda de canciones por ID
  - Almacenamiento de archivos de audio e imágenes

- Seguridad
  - Contraseñas encriptadas con bcrypt
  - Tokens JWT con expiración
  - Validación de datos de entrada
  - CORS configurado para desarrollo

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

### Canciones

- `GET /songs` - Obtener todas las canciones
- `GET /songs/:id` - Obtener una canción por ID

### Archivos Estáticos

- `GET /uploads/audio/:filename` - Acceder a archivos de audio
- `GET /uploads/images/:filename` - Acceder a imágenes

### Configuración

- `GET /api/config` - Obtener configuración del API (URLs base y endpoints)
  - Retorna: URLs base del API y todos los endpoints disponibles
  - Útil para el frontend para detectar automáticamente la URL del backend

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
│   ├── controller/
│   │   ├── user.controller.js
│   │   └── song.controller.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   ├── models/
│   │   ├── index.js
│   │   ├── user.js
│   │   └── song.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   └── song.routes.js
│   └── seeders/
├── uploads/
│   ├── audio/
│   └── images/
├── database.sqlite
├── package.json
└── README.md
```

## Tecnologías Utilizadas

- Node.js - Entorno de ejecución
- Express - Framework web
- Sequelize - ORM para base de datos
- SQLite - Base de datos
- JWT (jsonwebtoken) - Autenticación basada en tokens
- bcryptjs - Encriptación de contraseñas
- express-validator - Validación de datos
- cors - Configuración CORS
- morgan - Logger HTTP
- yt-dlp-wrap - Conversión de YouTube a audio

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm start` - Inicia el servidor en modo producción
- `npm run db:migrate:up` - Ejecuta las migraciones de la base de datos
- `npm run db:migrate:down` - Revierte la última migración

## Seguridad

- Las contraseñas se almacenan encriptadas usando bcrypt
- Los tokens JWT tienen expiración configurable
- Validación de formato de email y fortaleza de contraseñas
- CORS configurado para permitir solo orígenes autorizados
- Manejo de errores centralizado

## Licencia

ISC

## Autor

R4v3ns

## Repositorio

https://github.com/R4v3ns/back-end-Proyecto
