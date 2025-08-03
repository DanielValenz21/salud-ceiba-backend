import {
  getCoberturas,
  getAlertas,
  getSeries
} from '../services/dashboardService.js';

/* 43) GET /dashboard/coberturas */
export const listCoberturas = async (req, res, next) => {
  try {
    const rows = await getCoberturas(req.query);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* 44) GET /dashboard/alertas */
export const listAlertas = async (req, res, next) => {
  try {
    const rows = await getAlertas(req.query);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* 45) GET /dashboard/series */
export const serieHistorica = async (req, res, next) => {
  try {
    const payload = await getSeries(req.query);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};
