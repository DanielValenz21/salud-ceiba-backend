import { Router } from 'express';
import { authenticate }   from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';
import { auditLog }       from '../middlewares/log.js';
import { validate }       from '../middlewares/validate.js';

import {
  listQuerySchema, updatePersonaSchema
} from '../validators/persona.js';

import {
  listPersonas, getPersona, editPersona
} from '../controllers/personaController.js';

const router = Router();

/* GET /personas */
router.get('/', authenticate,
  validate(listQuerySchema),
  auditLog,
  listPersonas);

/* GET /personas/:id */
router.get('/:id', authenticate, auditLog, getPersona);

/* PUT /personas/:id */
router.put('/:id', authenticate,
  authorizeRoles(2,3,4),           // Digitador | Enfermera | Admin
  validate(updatePersonaSchema),
  auditLog,
  editPersona);

export default router;
