import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { alertsQuery } from '../validators/alerts.js';
import { listActiveAlerts } from '../controllers/alertsController.js';

const router = Router();

/* GET /alerts – Enfermera+ (rol ≥ 3) */
router.get(
  '/alerts',
  authenticate,
  requireRole(3, 4),
  validate(alertsQuery, 'query'),
  listActiveAlerts
);

export default router;
