import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorizeAdmin } from '../middlewares/authorize.js';
import { auditLog } from '../middlewares/log.js';
import { getTerritorios, getSectoresByTerritorio, postTerritorio, putTerritorio } from '../controllers/territorioController.js';

const router = Router();

/* GET /territorios */
router.get('/', authenticate, auditLog, getTerritorios);

/* POST /territorios */
router.post('/', authenticate, authorizeAdmin, auditLog, postTerritorio);

/* PUT /territorios/:id */
router.put('/:id', authenticate, authorizeAdmin, auditLog, putTerritorio);

/* GET /territorios/:id/sectores?includeStats=true */
router.get('/:id/sectores', authenticate, auditLog, getSectoresByTerritorio);

export default router;