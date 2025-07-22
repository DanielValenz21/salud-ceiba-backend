import { getPagination } from '../utils/pagination.js';
import {
  insertPersona, searchPersonas,
  getPersonaDetalle, updatePersona
} from '../models/personaModel.js';

/* POST /viviendas/:id/personas */
export const createPersona = async (req, res, next) => {
  try {
    const personaId = await insertPersona({
      vivienda_id: Number(req.params.id),
      ...req.body
    });
    res.locals.pk = personaId;           // para auditLog
    res.status(201).json({ persona_id: personaId });
  } catch (err) { next(err); }
};

/* GET /personas */
export const listPersonas = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const { total, rows } = await searchPersonas({
      q: req.query.q, dpi: req.query.dpi, offset, limit
    });
    res.json({ meta:{ page, limit, total }, data: rows });
  } catch (err) { next(err); }
};

/* GET /personas/:id */
export const getPersona = async (req, res, next) => {
  try {
    const persona = await getPersonaDetalle(req.params.id);
    if (!persona)
      return res.status(404).json({ error:'NotFound', message:'Persona no existe' });
    res.json(persona);
  } catch (err) { next(err); }
};

/* PUT /personas/:id */
export const editPersona = async (req, res, next) => {
  try {
    await updatePersona(req.params.id, req.body);
    res.locals.pk = req.params.id;
    res.json({ message:'Persona actualizada' });
  } catch (err) { next(err); }
};
