import { insertEvento, selectEventosPaginados, selectEventoDetalle } from '../models/eventos.model.js';
import { validateCreateEvento, validateListEventos, validateIdParam } from '../validators/eventos.validator.js';

// -------------------------
// POST /eventos
// -------------------------
export const createEvento = async (req, res, next) => {
  try {
    const { error, value } = validateCreateEvento(req.body);
    if (error) return res.status(400).json({ error: 'BadRequest', message: error.message });

    const responsable_id = req.user.user_id;
    const evento_id = await insertEvento({ ...value, responsable_id });

    res.locals.pk = evento_id;
    return res.status(201).json({ evento_id });
  } catch (err) {
    next(err);
  }
};

// -------------------------
// GET /eventos
// -------------------------
export const listEventos = async (req, res, next) => {
  try {
    const { error, value } = validateListEventos(req.query);
    if (error) return res.status(400).json({ error: 'BadRequest', message: error.message });

    const { meta, data } = await selectEventosPaginados(value);
    return res.json({ meta, data });
  } catch (err) {
    next(err);
  }
};

// -------------------------
// GET /eventos/:id
// -------------------------
export const getEventoById = async (req, res, next) => {
  try {
    const { error } = validateIdParam(req.params);
    if (error) return res.status(400).json({ error: 'BadRequest', message: error.message });

    const evento = await selectEventoDetalle(Number(req.params.id));
    if (!evento) return res.status(404).json({ error: 'NotFound', message: 'Evento no encontrado' });

    return res.json(evento);
  } catch (err) {
    next(err);
  }
};
