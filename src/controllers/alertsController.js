import { fetchAlerts } from '../services/alertsService.js';

export const listActiveAlerts = async (req, res, next) => {
  try {
    const rows = await fetchAlerts(req.query);
    res.json(rows);

    /* Push en tiempo real si hay sockets conectados */
    if (global.ioAlerts && rows.length) {
      rows.forEach((a) => global.ioAlerts.emitAlert('new', a));
    }
  } catch (err) {
    next(err);
  }
};
