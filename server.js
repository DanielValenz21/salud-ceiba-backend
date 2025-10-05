import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { corsMiddleware, corsOptionsRaw } from './src/config/cors.js';
import { swaggerMiddleware } from './src/config/swagger.js';

import authRoutes  from './src/routes/auth.js';
import userRoutes  from './src/routes/user.js';
import roleRoutes  from './src/routes/role.js';
import territorioRoutes from './src/routes/territorio.js';
import sectorRoutes     from './src/routes/sector.js';
import viviendaRoutes   from './src/routes/vivienda.js';
import personaRoutes    from './src/routes/persona.js';
import eventosRoutes    from './src/routes/eventos.routes.js';
import metricaRoutes    from './src/routes/metrica.js';
import metasRoutes     from './src/routes/metas.routes.js';

import { errorHandler } from './src/middlewares/errorHandler.js';
import { auditLog }    from './src/middlewares/log.js';
import { authenticate } from './src/middlewares/auth.js';           // protege /users y /roles
import clinicosRoutes  from './src/routes/clinicosRoutes.js';
import dashboardRoutes from './src/routes/dashboard.js';
import insumosRoutes   from './src/routes/insumos.js';   // ← NUEVO
import exportRoutes    from './src/routes/export.js';    // NUEVA RUTA de export
import qualityRoutes   from './src/routes/quality.js';
import alertsRoutes    from './src/routes/alerts.js';
import logsRoutes      from './src/routes/logs.js';
import saludPublicaRoutes from './src/routes/saludPublica.routes.js';
import { initSocket }  from './src/sockets/alertsSocket.js';

dotenv.config();
const app = express();

/* Seguridad y parseo */
app.use(helmet());
app.use(corsMiddleware);
app.options('*', cors(corsOptionsRaw));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

/* Documentación */
app.use('/docs', ...swaggerMiddleware);

/* Rutas públicas */
app.use('/api/v1/auth', authRoutes);

/* Rutas protegidas ─ requieren JWT */
app.use('/api/v1/users',      authenticate, auditLog, userRoutes);
app.use('/api/v1/roles',      authenticate, auditLog, roleRoutes);
app.use('/api/v1/territorios',authenticate, auditLog, territorioRoutes);
 app.use('/api/v1/sectores',   authenticate, auditLog, sectorRoutes);
app.use('/api/v1/viviendas',   viviendaRoutes);   // router maneja auth y log interno
app.use('/api/v1/personas',    personaRoutes);   // router maneja auth y log interno
app.use('/api/v1/eventos',     eventosRoutes);
app.use('/api/v1/metricas',    metricaRoutes);
// Rutas clínicos (vacunación, nutrición, reproductiva, epidemiología, morbilidad, mortalidad, ambiente)
app.use('/api/v1', clinicosRoutes);
// Metas module (routes handle auth internally)
app.use('/api/v1/metas', metasRoutes);
// Inventory module (Insumos)
app.use('/api/v1', insumosRoutes);           // ← NUEVO

/* ── NUEVO ── Dashboard & KPI (lectura) */
app.use('/api/v1/dashboard', dashboardRoutes);
/* ── NUEVO ── Reportes & exportaciones */
app.use('/api/v1/export', exportRoutes);
/* 🔰 Nuevos módulos */
app.use('/api/v1', qualityRoutes);
app.use('/api/v1', alertsRoutes);
app.use('/api/v1', logsRoutes);
app.use('/api/v1', saludPublicaRoutes);

/* 404 */
app.use((_req, res) =>
  res.status(404).json({ error: 'NotFound', message: 'Recurso no encontrado' })
);

/* Manejador de errores */
app.use(errorHandler);

/* Servidor HTTP + WebSocket ---------------------------------------- */
const PORT = process.env.PORT || 4000;
const httpServer = http.createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, () =>
  console.log(`🚀  API y WS activos en http://localhost:${PORT}`)
);