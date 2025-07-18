import { Router } from 'express';
import { login, refresh, logout } from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, refreshSchema, logoutSchema } from '../validators/auth.js';

const router = Router();

/* POST /api/v1/auth/login */
router.post('/login',   validate(loginSchema),   login);

/* POST /api/v1/auth/refresh */
router.post('/refresh', validate(refreshSchema), refresh);

/* POST /api/v1/auth/logout */
router.post('/logout',  validate(logoutSchema),  logout);

export default router; 