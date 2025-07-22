import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { auditLog }    from '../middlewares/log.js';
import { validate }    from '../middlewares/validate.js';
import { authorizeAdmin } from '../middlewares/authorize.js';

import {
  listSectores,
  createSector,
  getSector,
  editSector,
  deleteSector,
  getViviendasBySector
} from '../controllers/sectorController.js';

import {
  listQuerySchema,
  createSectorSchema,
  updateSectorSchema,
  viviendasQuerySchema
} from '../validators/sector.js';

const router = Router();

/* ----------- LISTA /sectores ---------------- */
router.get(
  '/',
  authenticate,
  validate(listQuerySchema),
  auditLog,
  listSectores
);

/* ----------- CREAR -------------------------- */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validate(createSectorSchema),
  auditLog,
  createSector
);

/* ----------- VIVIENDAS DEL SECTOR ----------- */
router.get(
  '/:id/viviendas',
  authenticate,
  validate(viviendasQuerySchema),
  auditLog,
  getViviendasBySector
);

/* ----------- GET / PUT / DELETE ------------- */
router.route('/:id')
  .get(   authenticate, auditLog, getSector)
  .put(   authenticate, authorizeAdmin, validate(updateSectorSchema), auditLog, editSector)
  .delete(authenticate, authorizeAdmin, auditLog, deleteSector);

export default router;