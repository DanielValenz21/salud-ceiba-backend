import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/log.js';
import { getSectorsGeo, createSector } from '../controllers/sectorController.js';
import { authorizeAdmin } from '../middlewares/authorize.js';

const router = Router();

/* GET /sectores (GeoJSON) */
router.get('/', authenticate, auditLog, getSectorsGeo);

/* POST /sectores (crea nuevo sector) */
router.post('/', authenticate, authorizeAdmin, auditLog, createSector);

export default router;