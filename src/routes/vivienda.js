import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { auditLog } from '../middlewares/log.js';
import { authenticate } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';

import {
  createViviendaSchema,
  updateViviendaSchema,
  personasQuerySchema
} from '../validators/vivienda.js';
import { createPersonaSchema } from '../validators/persona.js';

import {
  createVivienda,
  getVivienda,
  editVivienda,
  getPersonasByVivienda
} from '../controllers/viviendaController.js';
import { createPersona } from '../controllers/personaController.js';

/* ids de rol: 1-PROMOTOR 2-DIGITADOR 3-ENFERMERA 4-ADMIN */
const router = Router();

router.post(
  '/',
  authenticate,
  authorizeRoles(1,2,3,4),
  validate(createViviendaSchema),
  auditLog,
  createVivienda
);

router.get('/:id',
  authenticate,
  auditLog,
  getVivienda
);

router.put('/:id',
  authenticate,
  authorizeRoles(2,3,4),   // sin Promotor
  validate(updateViviendaSchema),
  auditLog,
  editVivienda
);

router.get('/:id/personas',
  authenticate,
  validate(personasQuerySchema),
  auditLog,
  getPersonasByVivienda
);

router.post('/:id/personas',
  authenticate,
  authorizeRoles(1, 2, 3, 4), // Promotor | Digitador | Enfermera | Admin
  validate(createPersonaSchema),
  auditLog,
  createPersona
);

export default router;
