import { Router } from 'express';
import { getTerritorios, getSectoresByTerritorio } from '../controllers/territorioController.js';
import { authorizeAdmin } from '../middlewares/authorize.js'; // solo para POST/PUT/DELETE (ninguno aquí)

const router = Router();

/* GET /territorios */
router.get('/', getTerritorios);

/* GET /territorios/:id/sectores?includeStats=true */
router.get('/:id/sectores', getSectoresByTerritorio);

export default router; 