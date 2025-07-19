import { Router } from 'express';
import { authorizeAdmin } from '../middlewares/authorize.js';
import { getRoles } from '../controllers/userController.js';

const router = Router();

/* GET /roles */
router.get('/', authorizeAdmin, getRoles);

export default router; 