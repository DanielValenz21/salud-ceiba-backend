import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as ctrl from '../controllers/clinicosController.js';

const r = Router();

/* ---- Vacunación ---- */
r.post(
  '/vacunacion/eventos',
  authenticate,
  requireRole('promotor','admin'),
  (req,_res,next) => { req.modulo = 'vacunacion'; next(); },
  ctrl.createEvento
);
r.get(
  '/vacunacion/coberturas',
  authenticate,
  requireRole('promotor','admin'),
  ctrl.listCoberturas
);

/* ---- Nutrición ---- */
r.post(
  '/nutricion/eventos',
  authenticate,
  requireRole('promotor','admin'),
  (req,_res,next) => { req.modulo = 'nutricion'; next(); },
  ctrl.createEvento
);
r.get(
  '/nutricion/coberturas',
  authenticate,
  requireRole('promotor','admin'),
  ctrl.listCoberturas
);

/* ---- Salud reproductiva ---- */
r.post(
  '/reproductiva/eventos',
  authenticate,
  requireRole('promotor','admin'),
  (req,_res,next) => { req.modulo = 'reproductiva'; next(); },
  ctrl.createEvento
);
r.get(
  '/reproductiva/coberturas',
  authenticate,
  requireRole('promotor','admin'),
  ctrl.listCoberturas
);

/* ---- Epidemiología ---- */
r.post(
  '/epidemiologia/eventos',
  authenticate,
  requireRole('promotor','admin'),
  (req,_res,next) => { req.modulo = 'epidemiologia'; next(); },
  ctrl.createEvento
);
r.get(
  '/epidemiologia/coberturas',
  authenticate,
  requireRole('promotor','admin'),
  ctrl.listCoberturas
);

/* ---- Morbilidad SIGSA 7 ---- */
r.post(
  '/morbilidad/casos',
  authenticate,
  requireRole('digitador','admin'),
  ctrl.upsertMorbilidad
);
r.get(
  '/morbilidad/casos',
  authenticate,
  ctrl.listMorbilidad
);

/* ---- Mortalidad ---- */
r.post(
  '/mortalidad/registros',
  authenticate,
  requireRole('digitador','admin'),
  ctrl.createDefuncion
);

/* ---- Ambiente ---- */
r.post(
  '/ambiente/metricas',
  authenticate,
  requireRole('digitador','admin'),
  ctrl.upsertMetrica
);

export default r;
