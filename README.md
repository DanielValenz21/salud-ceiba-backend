# Salud La Ceiba Backend

Backend API para el sistema de gestión de Salud La Ceiba construido con Node.js, Express y MySQL.

## 🚀 Características

- **Autenticación JWT** con tokens de acceso y refresco
- **Validación de datos** con Joi
- **Documentación automática** con Swagger/OpenAPI
- **Logging y auditoría** de todas las operaciones
- **Seguridad** con Helmet y CORS configurado
- **Base de datos MySQL** con pool de conexiones
- **Middleware de manejo de errores** centralizado

## 📋 Prerrequisitos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd salud-la-ceiba-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus credenciales:
   ```env
   PORT=4000
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=tuPassword
   DB_NAME=salud_la_ceiba
   JWT_SECRET=supersecreto
   JWT_REFRESH_SECRET=superrefresco
   LOG_LEVEL=debug
   ALLOWED_ORIGINS=http://localhost:5173,https://midominio.app
   ```

4. **Crear la base de datos**
   ```sql
   CREATE DATABASE salud_la_ceiba;
   ```

## 🏃‍♂️ Ejecución

**Desarrollo:**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:4000`

## 📚 Documentación

La documentación de la API está disponible en:
- **Swagger UI**: `http://localhost:4000/docs`
- **OpenAPI Spec**: `http://localhost:4000/docs/openapi.yaml`

## 🗂️ Estructura del Proyecto

```
salud-la-ceiba-backend/
├── src/
│   ├── config/          # Configuraciones (DB, CORS, Swagger)
│   ├── controllers/     # Controladores de la API
│   ├── middlewares/     # Middlewares (auth, validation, logging)
│   ├── models/          # Modelos de base de datos
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades (JWT, pagination)
│   └── validators/      # Esquemas de validación Joi
├── docs/
│   └── openapi.yaml     # Documentación OpenAPI
├── .env.example         # Variables de entorno de ejemplo
├── server.js            # Punto de entrada de la aplicación
└── package.json
```

## 🔐 Endpoints de Autenticación

### POST /api/v1/auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role_id": 1,
  "persona_id": 123
}
```

### POST /api/v1/auth/login
Inicia sesión y retorna tokens JWT.

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🔒 Seguridad

- **JWT Tokens**: Tokens de acceso (15 min) y refresco (7 días)
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado con whitelist de orígenes
- **bcrypt**: Hash de contraseñas con 12 salt rounds
- **Validación**: Todos los inputs validados con Joi

## 📝 Logging

Todas las operaciones se registran automáticamente en la tabla `logs` con:
- Usuario que realizó la acción
- Tipo de operación (CREATE, UPDATE, DELETE, EXPORT)
- Recurso afectado
- Hash del payload para auditoría
- IP y User-Agent

## 🚀 Próximos Pasos

- [ ] Implementar 2FA para administradores
- [ ] Agregar endpoints para gestión de usuarios
- [ ] Implementar refresh token endpoint
- [ ] Agregar rate limiting
- [ ] Configurar HTTPS en producción
- [ ] Implementar tests unitarios

## 📄 Licencia

MIT License 