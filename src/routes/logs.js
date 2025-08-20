import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorizeAdmin } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { logsQuery } from '../validators/logs.js';
import { listLogs } from '../controllers/logsController.js';

const router = Router();

/* GET /logs – solo ADMIN */
router.get(
  '/logs',
  authenticate,
  authorizeAdmin,
  validate(logsQuery, 'query'),
  listLogs
);

export default router;
