/*  Servicios del Dashboard  – versión SIN Redis (no usa caché)  */

import db     from '../utils/db.js';
import crypto from 'crypto';

/* util interno para construir keys de serie */
const hash = obj => crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');

/* ------------------------------------------------------------------ */
/* 43) GET /dashboard/coberturas                                       */
/* ------------------------------------------------------------------ */
export const getCoberturas = async (q) => {
  const where  = [];
  const params = [];

  /* periodo YYYYMM ó rango YYYYMM-YYYYMM */
  if (q.periodo) {
    const [d1, d2] = q.periodo.split('-');
    const from = parseInt(d1, 10);
    const to   = d2 ? parseInt(d2, 10) : from;
    where.push('periodo BETWEEN ? AND ?');
    params.push(from, to);
  }
  if (q.territorio_id) { where.push('territorio_id = ?'); params.push(q.territorio_id); }
  if (q.sector_id)     { where.push('sector_id = ?');     params.push(q.sector_id);     }
  if (q.ind_id)        { where.push('ind_id = ?');        params.push(q.ind_id);        }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [rows] = await db.execute(
    `SELECT ind_id, ind_nombre, territorio_id, sector_id, periodo,
            valor_num, valor_den, valor_objetivo, cobertura_pct
       FROM dashboard_coberturas
       ${whereSQL}
       ORDER BY ind_id, territorio_id, sector_id, periodo`, params);

  return rows;
};

/* ------------------------------------------------------------------ */
/* 44) GET /dashboard/alertas                                          */
/* ------------------------------------------------------------------ */
export const getAlertas = async (q) => {
  const where  = ['cobertura_pct < 100'];       // solo bajos a la meta
  const params = [];

  if (q.periodo)       { where.push('periodo = ?');        params.push(parseInt(q.periodo,10)); }
  if (q.territorio_id) { where.push('territorio_id = ?');  params.push(q.territorio_id);        }

  const whereSQL = 'WHERE ' + where.join(' AND ');

  const [rows] = await db.execute(
    `SELECT ind_id, ind_nombre, territorio_id, periodo,
            cobertura_pct, valor_num, valor_objetivo
       FROM dashboard_coberturas
       ${whereSQL}
       ORDER BY cobertura_pct ASC`, params);

  return rows;          // [] si no hay alertas
};

/* ------------------------------------------------------------------ */
/* 45) GET /dashboard/series                                           */
/* ------------------------------------------------------------------ */
export const getSeries = async (q) => {
  const where  = ['m.ind_id = ?'];
  const params = [q.ind_id];

  if (q.territorio_id) { where.push('m.territorio_id = ?'); params.push(q.territorio_id); }
  if (q.sector_id)     { where.push('m.sector_id = ?');     params.push(q.sector_id);     }

  if (q.desde) { where.push('(m.anio*100+m.mes) >= ?'); params.push(parseInt(q.desde,10)); }
  if (q.hasta) { where.push('(m.anio*100+m.mes) <= ?'); params.push(parseInt(q.hasta,10)); }

  const whereSQL = 'WHERE ' + where.join(' AND ');

  const [rows] = await db.execute(
    `SELECT (m.anio*100+m.mes) AS periodo,
            m.territorio_id, m.sector_id,
            m.valor_num, m.valor_den,
            meta.valor_objetivo,
            i.nombre         AS ind_nombre
       FROM metrica_mensual m
       JOIN metas meta
         ON meta.ind_id        = m.ind_id
        AND meta.territorio_id = m.territorio_id
        AND meta.anio          = m.anio
       JOIN indicadores i ON i.ind_id = m.ind_id
       ${whereSQL}
       ORDER BY periodo`, params);

  /* ------ transformar a payload consumible por el front ------ */
  const labelsSet = new Set();
  const seriesMap = new Map();           // key = territorio_id:sector_id

  for (const r of rows) {
    labelsSet.add(r.periodo);
    const key = `${r.territorio_id}:${r.sector_id ?? 'null'}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        territorio_id : r.territorio_id,
        sector_id     : r.sector_id ?? null,
        valor_num : [], valor_den : [], valor_obj : [], cobertura : []
      });
    }
    const s = seriesMap.get(key);
    s.valor_num.push(r.valor_num);
    s.valor_den.push(r.valor_den);
    s.valor_obj.push(r.valor_objetivo);
    s.cobertura.push(Math.round(r.valor_num / (r.valor_objetivo || 1) * 100));
  }

  return {
    ind_id     : q.ind_id,
    ind_nombre : rows[0]?.ind_nombre ?? null,
    labels     : Array.from(labelsSet),
    series     : Array.from(seriesMap.values())
  };
};
