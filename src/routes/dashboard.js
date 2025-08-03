import { Router } from 'express';
import { authOptional, authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

import {
  coberturasQuery,
  alertasQuery,
  seriesQuery
} from '../validators/dashboard.js';

import {
  listCoberturas,
  listAlertas,
  serieHistorica
} from '../controllers/dashboardController.js';

const r = Router();

/* 43) KPIs – disponible para cualquier visitante con o sin JWT */
r.get('/coberturas',
      authOptional,
      validate(coberturasQuery),
      listCoberturas);

/* 44) Alertas – requiere JWT rol ≥ ENFERMERA (3) */
r.get('/alertas',
      authenticate,
      requireRole(3,4),
      validate(alertasQuery),
      listAlertas);

/* 45) Serie temporal – token opcional */
r.get('/series',
      authOptional,
      validate(seriesQuery),
      serieHistorica);

export default r;
