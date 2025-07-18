import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './src/config/cors.js';
import { swaggerMiddleware } from './src/config/swagger.js';
import authRoutes from './src/routes/auth.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import { auditLog } from './src/middlewares/log.js';

dotenv.config();
const app = express();

// Seguridad y parseadores
app.use(helmet());
app.use(corsOptions);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.LOG_LEVEL));

// Documentación
app.use('/docs', ...swaggerMiddleware);

// Rutas v1
app.use('/api/v1/auth', auditLog, authRoutes);

// 404
app.use((_req, res) => res.status(404).json({ error: 'NotFound', message: 'Recurso no encontrado' }));

// Manejador de errores
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀  API lista en http://localhost:${PORT}  (docs en /docs)`)); 