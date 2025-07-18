# Configuración del Sistema de Autenticación

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=Daniel12
DB_NAME=salud_la_ceiba

JWT_SECRET=supersecreto
JWT_REFRESH_SECRET=superrefresco
LOG_LEVEL=dev
ALLOWED_ORIGINS=http://localhost:5173
```

## Base de Datos

Ejecuta el script SQL para crear la tabla de refresh tokens:

```sql
-- Ejecutar en tu base de datos MySQL
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  revoked BOOLEAN DEFAULT FALSE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(user_id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

## Endpoints Disponibles

### POST /api/v1/auth/login
Inicia sesión con email y password.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/v1/auth/refresh
Renueva el access token usando un refresh token válido.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/v1/auth/logout
Cierra la sesión revocando el refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Sesión terminada"
}
```

## Documentación

La documentación completa de la API está disponible en: `http://localhost:4000/docs` 