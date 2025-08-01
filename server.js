import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './src/config/cors.js';
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

import { errorHandler } from './src/middlewares/errorHandler.js';
import { auditLog }    from './src/middlewares/log.js';
import { authenticate } from './src/middlewares/auth.js';           // protege /users y /roles
import clinicosRoutes  from './src/routes/clinicosRoutes.js';

dotenv.config();
const app = express();

/* Seguridad y parseo */
app.use(helmet());
app.use(corsOptions);
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

/* 404 */
app.use((_req, res) =>
  res.status(404).json({ error: 'NotFound', message: 'Recurso no encontrado' })
);

/* Manejador de errores */
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀  API lista en http://localhost:${PORT}  (docs en /docs)`)
); 