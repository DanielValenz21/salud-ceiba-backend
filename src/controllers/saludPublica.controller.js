import * as Svc from '../services/saludPublica.service.js';

export async function causas(_req, res, next) {
  try {
    const data = await Svc.getCausas();
    res.json(data);
  } catch (err) { next(err); }
}

export async function anios(req, res, next) {
  try {
    const modulo = req.query.modulo || 'morbilidad';
    const data = await Svc.getAnios(modulo);
    res.json(data);
  } catch (err) { next(err); }
}

export async function meses(req, res, next) {
  try {
    const modulo = req.query.modulo || 'morbilidad';
    const anio = Number(req.query.anio);
    const territorioId = req.query.territorioId || 'all';
    const data = await Svc.getMeses(modulo, anio, territorioId);
    res.json(data);
  } catch (err) { next(err); }
}

export async function kpiMorbilidad(req, res, next) {
  try {
    const territorioId = req.query.territorioId || 'all';
    const anio = req.query.anio ? Number(req.query.anio) : undefined;
    const mes = req.query.mes ? (req.query.mes === 'all' ? 'all' : Number(req.query.mes)) : 'all';
    const data = await Svc.getKpiMorbilidad({ territorioId, anio, mes });
    res.json(data);
  } catch (err) { next(err); }
}

export async function kpiMortalidad(req, res, next) {
  try {
    const territorioId = req.query.territorioId || 'all';
    const anio = req.query.anio ? Number(req.query.anio) : undefined;
    const mes = req.query.mes ? (req.query.mes === 'all' ? 'all' : Number(req.query.mes)) : 'all';
    const data = await Svc.getKpiMortalidad({ territorioId, anio, mes });
    res.json(data);
  } catch (err) { next(err); }
}

export async function kpiAmbiente(req, res, next) {
  try {
    const territorioId = req.query.territorioId || 'all';
    const anio = req.query.anio ? Number(req.query.anio) : undefined;
    const mes = req.query.mes ? (req.query.mes === 'all' ? 'all' : Number(req.query.mes)) : 'all';
    const data = await Svc.getKpiAmbiente({ territorioId, anio, mes });
    res.json(data);
  } catch (err) { next(err); }
}

export async function consultaMorbilidad(req, res, next) {
  try {
    const territorioId = req.query.territorioId || 'all';
    const anio = Number(req.query.anio);
    const mes = req.query.mes ? (req.query.mes === 'all' ? 'all' : Number(req.query.mes)) : 'all';
    const causaId = req.query.causaId ? Number(req.query.causaId) : 'all';
    const data = await Svc.consultarMorbilidad({ territorioId, anio, mes, causaId });
    res.json(data);
  } catch (err) { next(err); }
}

export async function consultaMortalidad(req, res, next) {
  try {
    const territorioId = req.query.territorioId || 'all';
    const anio = Number(req.query.anio);
    const mes = req.query.mes ? (req.query.mes === 'all' ? 'all' : Number(req.query.mes)) : 'all';
    const causaId = req.query.causaId ? Number(req.query.causaId) : 'all';
    const data = await Svc.consultarMortalidad({ territorioId, anio, mes, causaId });
    res.json(data);
  } catch (err) { next(err); }
}

export async function consultaAmbiente(req, res, next) {
  try {
    const territorioId = req.query.territorioId || 'all';
    const anio = Number(req.query.anio);
    const mes = req.query.mes ? (req.query.mes === 'all' ? 'all' : Number(req.query.mes)) : 'all';
    const indId = req.query.indId ? Number(req.query.indId) : 'all';
    const data = await Svc.consultarAmbiente({ territorioId, anio, mes, indId });
    res.json(data);
  } catch (err) { next(err); }
}
