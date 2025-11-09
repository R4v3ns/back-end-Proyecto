# Proyecto Back-End

Este es el repositorio del back-end para la gestión de usuarios y autenticación con Node.js, Express y Sequelize.

## Requisitos

- Node.js (v14 o superior)
- npm
- Base de datos SQLite (o puedes adaptar para PostgreSQL/MySQL)

## Instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/tu-usuario/back-end-Proyecto.git
   ```

2. Ingresa a la carpeta del proyecto:
   ```
   cd back-end-Proyecto
   ```

3. Instala las dependencias:
   ```
   npm install
   ```

4. Copia el archivo de variables de entorno:
   ```
   cp .env.example .env
   ```
   Ajusta las variables del archivo `.env` según tus necesidades.

5. Ejecuta las migraciones de la base de datos:
   ```
   npx sequelize db:migrate
   ```

## Ejecución

En desarrollo:
```
npm run dev
```

En producción:
```
npm start
```

## Endpoints principales

- `POST /api/users/register`: Registrar usuario
- `POST /api/users/login`: Iniciar sesión
  - Body: `{ email, password }`
  - Retorna: token JWT, información del usuario

- `POST /api/users/logout`: Cerrar sesión

### Gestión de Cuenta

- `POST /api/users/change-password`: Cambiar contraseña (requiere autenticación)
- `PUT /api/users/profile`: Actualizar perfil (requiere autenticación)
- `GET /api/users/preferences`: Ver preferencias (requiere autenticación)
- `PUT /api/users/preferences`: Actualizar preferencias (requiere autenticación)
- `GET /api/users/plan`: Ver plan actual (requiere autenticación)
- `PUT /api/users/plan`: Actualizar plan (requiere autenticación)

## Notas

- Todas las rutas protegidas requieren enviar el token JWT en el encabezado `Authorization` con el formato: `Bearer <token>`.
- El proyecto incluye manejo de errores, middlewares y validaciones básicas.

## Licencia

MIT
