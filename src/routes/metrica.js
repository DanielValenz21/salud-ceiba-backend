import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/log.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import {
  listMetricas,
  bulkUpsertMetricas,
} from '../controllers/metricaController.js';
import {
  validateQueryMetricas,
  validateBodyMetricas,
} from '../validators/metrica.js';

const router = express.Router();

/* GET /metricas – cualquier usuario con JWT */
router.get(
  '/',
  authenticate,
  auditLog,
  validateQueryMetricas,
  listMetricas
);

/* PUT /metricas – roles 2,3,4 (DIGITADOR+, ENFERMERA, ADMIN) */
router.put(
  '/',
  authenticate,
  authorizeRoles(2, 3, 4),
  auditLog,
  validateBodyMetricas,
  bulkUpsertMetricas
);

export default router;
