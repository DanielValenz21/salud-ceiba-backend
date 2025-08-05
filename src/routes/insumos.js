import { Router } from 'express';
import { authenticate }   from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';  // 3-Enfermera, 4-Admin
import { auditLog }       from '../middlewares/log.js';
import { validate }       from '../middlewares/validate.js';

import {
  stockQuery, movimientoBody, loteQuery
} from '../validators/insumo.js';

import {
  getStock, createMovimiento, traceLote
} from '../controllers/insumoController.js';

const r = Router();

/* 46) GET /insumos */
r.get('/insumos',
  authenticate, authorizeRoles(3,4),
  validate(stockQuery, 'query'), auditLog, getStock);

/* 47) POST /insumos/movimientos */
r.post('/insumos/movimientos',
  authenticate, authorizeRoles(3,4),
  validate(movimientoBody, 'body'), auditLog, createMovimiento);

/* 48) GET /insumos/lotes/:lote */
r.get('/insumos/lotes/:lote',
  authenticate, authorizeRoles(3,4),
  validate(loteQuery, 'query'), auditLog, traceLote);

export default r;
