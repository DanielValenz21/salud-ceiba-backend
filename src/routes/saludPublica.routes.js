import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as C from '../controllers/saludPublica.controller.js';

const r = Router();

// Catálogos
r.get('/causas', authenticate, C.causas);

// Períodos
r.get('/periodos/anios', authenticate, C.anios);
r.get('/periodos/meses', authenticate, C.meses);

// KPIs
r.get('/morbilidad/kpi/total', authenticate, C.kpiMorbilidad);
r.get('/mortalidad/kpi/total', authenticate, C.kpiMortalidad);
r.get('/ambiente/kpi/total', authenticate, C.kpiAmbiente);

// Consultas
r.get('/morbilidad/consulta', authenticate, C.consultaMorbilidad);
r.get('/mortalidad/consulta', authenticate, C.consultaMortalidad);
r.get('/ambiente/metricas', authenticate, C.consultaAmbiente);

export default r;
