import Joi from 'joi';
import * as svc from '../services/clinicosService.js';
import { BadRequest } from '../utils/errors.js';

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
const defuncionSchema = Joi.object({
  persona_id:      Joi.number().integer().positive().allow(null),
  causa_id:        Joi.number().integer().positive().required(),
  territorio_id:   Joi.number().integer().positive().required(),
  fecha_defuncion: Joi.date().max('now').required(),
  lugar_defuncion: Joi.string().valid('hospital','domicilio','otro').required(),
  certificador_id: Joi.number().integer().positive().required(),
  detalle_json:    Joi.object().default({})
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

export async function createDefuncion(req, res) {
  const dto = await defuncionSchema.validateAsync(req.body, { abortEarly:false });
  const defuncion_id = await svc.insertDefuncion(dto);
  res.status(201).json({ defuncion_id });
}

export async function upsertMetrica(req, res) {
  const dto = await metricaSchema.validateAsync(req.body, { abortEarly:false });
  await svc.upsertMetrica(dto);
  res.status(204).send();
}
