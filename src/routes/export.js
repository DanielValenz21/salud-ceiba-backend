import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { auditLog } from '../middlewares/log.js';
import {
  salaSituacionalPdf,
  produccionExcel,
  rawCsv
} from '../controllers/exportController.js';

const router = Router();

// Todos requieren rol ADMIN
router.get('/pdf/sala-situacional',
  authenticate, requireRole('admin'), auditLog,
  salaSituacionalPdf
);

router.get('/excel/produccion',
  authenticate, requireRole('admin'), auditLog,
  produccionExcel
);

router.get('/csv/raw',
  authenticate, requireRole('admin'), auditLog,
  rawCsv
);

export default router;
