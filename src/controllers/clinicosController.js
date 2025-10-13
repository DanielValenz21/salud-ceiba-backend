import Joi from 'joi';
import * as svc from '../services/clinicosService.js';
import { BadRequest } from '../utils/errors.js';
import { mortalidadListQuerySchema } from '../validators/clinicos.js';

// Utils
const moduleRanges = {
  vacunacion:   [  1,  20],
  nutricion:    [ 21, 100],
  reproductiva: [101, 200],
  epidemiologia:[201, 300]
};
function checkIndModulo(modulo, ind_id) {
  const [min, max] = moduleRanges[modulo] || [];
  if (!min || ind_id < min || ind_id > max) {
    throw new BadRequest(`ind_id fuera de rango para módulo ${modulo}`);
  }
}

// Schemas
const eventoSchema = Joi.object({
  persona_id:     Joi.number().integer().positive().allow(null),
  sector_id:      Joi.number().integer().positive().required(),
  ind_id:         Joi.number().integer().positive().required(),
  valor_num:      Joi.number().precision(2).allow(null),
  valor_texto:    Joi.string().max(120).allow(null),
  lote:           Joi.string().max(20).allow(null),
  fecha_evento:   Joi.date().required(),
  responsable_id: Joi.number().integer().positive().required(),
  detalle_json:   Joi.object().default({})
});
const morbilidadPostSchema = Joi.object({
  anio:          Joi.number().integer().min(2000).max(2100).required(),
  mes:           Joi.number().integer().min(1).max(12).required(),
  territorio_id: Joi.number().integer().positive().required(),
  datos:         Joi.array().items(
                    Joi.object({
                      causa_id:   Joi.number().integer().positive().required(),
                      grupo_edad: Joi.string().valid('0-<1','1-4','5-14','15+').required(),
                      casos:      Joi.number().integer().min(0).required()
                    })
                  ).min(1).required()
});
// --- helpers de normalización (mismo criterio que en el service) ---
const LUGARES_VALIDOS = ['hospital', 'hogar', 'vía pública', 'otro'];

function normalizeLugar(val) {
  const raw = (val ?? '').toString().trim();
  const base = raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/\s+/g, ' ');

  if (base === 'hospital') return 'hospital';
  if (base === 'hogar' || base === 'domicilio' || base === 'casa') return 'hogar';
  if (base === 'via publica') return 'vía pública';
  if (base === 'otro') return 'otro';
  return 'hogar'; // default seguro
}

const crearDefuncionSchema = Joi.object({
  persona_id: Joi.number().integer().positive().allow(null),
  causa_id: Joi.number().integer().required(),
  territorio_id: Joi.number().integer().required(),
  fecha_defuncion: Joi.date().iso().required(),
  // aceptamos cualquier string y luego normalizamos + validamos contra el set
  lugar_defuncion: Joi.string().required(),
  certificador_id: Joi.number().integer().allow(null),
  detalle_json: Joi.object().unknown(true).optional()
});
const metricaSchema = Joi.object({
  ind_id:        Joi.number().integer().min(301).max(310).required(),
  territorio_id: Joi.number().integer().positive().required(),
  anio:          Joi.number().integer().min(2000).max(2100).required(),
  mes:           Joi.number().integer().min(1).max(12).required(),
  valor_num:     Joi.number().integer().min(0).required(),
  valor_den:     Joi.number().integer().min(0).allow(null)
});
const coberturasSchema = Joi.object({
  territorio_id: Joi.number().integer().positive().required(),
  anio:          Joi.number().integer().min(2000).max(2100).required()
});

// Controllers
export async function createEvento(req, res, next) {
  try {
    const modulo  = req.modulo;
    const payload = await eventoSchema.validateAsync(req.body, { abortEarly:false });
    checkIndModulo(modulo, payload.ind_id);
    const evento_id = await svc.insertEvento(payload);
    return res.status(201).json({ evento_id });
  } catch (err) {
    return next(err);
  }
}

export async function listCoberturas(req, res) {
  const dto  = await coberturasSchema.validateAsync(req.query, { abortEarly:false });
  const rows = await svc.listCoberturas(dto);
  res.json(rows);
}

export async function upsertMorbilidad(req, res) {
  const dto = await morbilidadPostSchema.validateAsync(req.body, { abortEarly:false });
  await svc.upsertMorbilidadLote(dto);
  res.status(204).send();
}

export async function listMorbilidad(req, res) {
  const rows = await svc.listMorbilidad(req.query);
  res.json(rows);
}

export async function createDefuncion(req, res, next) {
  try {
    const raw = await crearDefuncionSchema.validateAsync(req.body, { abortEarly: false });

    const lugar = normalizeLugar(raw.lugar_defuncion);
    if (!LUGARES_VALIDOS.includes(lugar)) {
      return res.status(400).json({ error: 'BadRequest', message: 'lugar_defuncion inválido' });
    }

    const payload = { ...raw, lugar_defuncion: lugar };
    const defuncion_id = await svc.insertDefuncion(payload);
    return res.status(201).json({ defuncion_id });
  } catch (err) {
    return next(err);
  }
}

export async function upsertMetrica(req, res) {
  const dto = await metricaSchema.validateAsync(req.body, { abortEarly:false });
  await svc.upsertMetrica(dto);
  res.status(204).send();
}

// GET indicadores por módulo
export async function listIndicadores(req, res, next) {
  try {
    const modulo = req.modulo || req.params.modulo || req.query.modulo;
    if (!modulo) throw new BadRequest('Parámetro modulo es obligatorio');
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const q     = (req.query.q || '').trim();
    const { total, rows } = await svc.listIndicadores({
      modulo,
      q,
      limit,
      offset: (page - 1) * limit
    });
    res.json({ meta: { page, limit, total }, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function listMortalidad(req, res, next) {
  try {
    const q = await mortalidadListQuerySchema.validateAsync(req.query, { abortEarly: false });
    const data = await svc.listMortalidad(q);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
