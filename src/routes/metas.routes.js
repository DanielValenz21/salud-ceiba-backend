import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authOptional, authRequired } from '../middlewares/auth.js';
import { metasSchema } from '../validators/metasValidator.js';
import * as metasCtrl from '../controllers/metasController.js';

const router = Router();

// 41 GET /metas  (token opcional)
router.get(
  '/',
  authOptional,
  metasCtrl.getMetas
);

// 42 PUT /metas  (ADMIN)
router.put(
  '/',
  authRequired('admin'),
  validate(metasSchema),
  metasCtrl.upsertMetas
);

export default router;
