import { Router } from 'express';
import { authOptional } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { qualityQuery } from '../validators/quality.js';
import { listQualityIssues } from '../controllers/qualityController.js';

const router = Router();

/* GET /quality/issues – token opcional */
router.get(
  '/quality/issues',
  authOptional,
  validate(qualityQuery, 'query'),
  listQualityIssues
);

export default router;
