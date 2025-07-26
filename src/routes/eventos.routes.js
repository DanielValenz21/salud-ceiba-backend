import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import { auditLog } from '../middlewares/log.js';

import {
  createEvento,
  listEventos,
  getEventoById,
} from '../controllers/eventos.controller.js';

const router = Router();

// 26) POST /eventos — Promotor, Digitador, Enfermera, Admin
router.post(
  '/',
  authenticate,
  authorizeRoles(1, 2, 3, 4),
  auditLog,
  createEvento
);

// 27) GET /eventos — Cualquier usuario autenticado
router.get('/', authenticate, listEventos);

// 28) GET /eventos/:id — Cualquier usuario autenticado
router.get('/:id', authenticate, getEventoById);

export default router;
