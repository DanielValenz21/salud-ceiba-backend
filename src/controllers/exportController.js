import { pool }          from '../config/db.js';
import {
  generatePdf,
  generateExcel,
  exportCsv
} from '../services/reportService.js';

/* ---------- PDF sala situacional ---------- */
export const salaSituacionalPdf = async (req, res, next) => {
  try {
    const { mes, territorio, con_alertas = 'false' } = req.query;
    const periodo = mes ?? new Date().toISOString().slice(0,7).replace('-','');

    /* 1) Datos KPI */
    const [kpis] = await pool.execute(
      `SELECT * FROM dashboard_coberturas
        WHERE periodo=? AND (? IS NULL OR territorio_id=?)`,
      [periodo, territorio, territorio]
    );

    /* 2) Alertas opcionales */
    let alertas = [];
    if (con_alertas === 'true') {
      [alertas] = await pool.execute(
        `SELECT * FROM dashboard_coberturas
          WHERE periodo=? AND cobertura_pct<100
            AND valor_objetivo IS NOT NULL
            AND (? IS NULL OR territorio_id=?)`,
        [periodo, territorio, territorio]
      );
    }

    /* 3) Render → PDF */
    const pdf = await generatePdf('sala-situacional', {
      kpis, alertas,
      usuario : req.user?.user_id ?? 'anon',
      fecha   : new Date().toLocaleString()
    });

    res.set({
      'Content-Type'       : 'application/pdf',
      'Content-Disposition': `attachment; filename="sala-situacional_${periodo}.pdf"`
    }).send(pdf);
  } catch (err) { next(err); }
};

/* ---------- Excel producción ---------- */
export const produccionExcel = async (req, res, next) => {
  try {
    const desde = (req.query.desde ?? `${new Date().getFullYear()}-01`);
    const hasta = (req.query.hasta ?? new Date().toISOString().slice(0,7));
    const territorio = req.query.territorio ?? null;

    /* hoja eventos */
    const [eventos] = await pool.execute(
      `SELECT  e.evento_id, e.persona_id, e.ind_id, i.nombre indicador,
               e.valor_num, e.valor_texto, e.lote,
               e.fecha_evento, s.sector_id, t.territorio_id
         FROM eventos e
         JOIN indicadores i USING(ind_id)
         JOIN sectores   s USING(sector_id)
         JOIN territorios t USING(territorio_id)
        WHERE DATE_FORMAT(e.fecha_evento,'%Y-%m') BETWEEN ? AND ?
          AND (? IS NULL OR t.territorio_id = ?)
        ORDER BY e.fecha_evento`,
      [desde, hasta, territorio, territorio]
    );

    /* hoja métricas */
    const [metricas] = await pool.execute(
      `SELECT  m.ind_id, i.nombre,
               m.territorio_id, t.nombre territorio,
               CONCAT(m.anio,'-',LPAD(m.mes,2,'0')) periodo,
               m.valor_num, m.valor_den,
               ROUND(m.valor_num / NULLIF(m.valor_den,0) * 100,1) cobertura_pct
         FROM metrica_mensual m
         JOIN indicadores i USING(ind_id)
         JOIN territorios t USING(territorio_id)
        WHERE CONCAT(m.anio,'-',LPAD(m.mes,2,'0')) BETWEEN ? AND ?
          AND (? IS NULL OR m.territorio_id = ?)
        ORDER BY periodo`,
      [desde, hasta, territorio, territorio]
    );

    const buffer = await generateExcel({
      sheets: [
        {
          name:'eventos',
          columns: [
            { header:'evento_id', key:'evento_id' },
            { header:'persona_id', key:'persona_id' },
            { header:'ind_id', key:'ind_id' },
            { header:'indicador', key:'indicador' },
            { header:'valor_num', key:'valor_num' },
            { header:'valor_texto', key:'valor_texto' },
            { header:'lote', key:'lote' },
            { header:'fecha_evento', key:'fecha_evento' },
            { header:'sector_id', key:'sector_id' },
            { header:'territorio_id', key:'territorio_id' }
          ],
          rows: eventos,
          autoFilter:true
        },
        {
          name:'metricas',
          columns:[
            { header:'ind_id', key:'ind_id' },
            { header:'nombre', key:'nombre' },
            { header:'territorio_id', key:'territorio_id' },
            { header:'territorio', key:'territorio' },
            { header:'periodo', key:'periodo' },
            { header:'valor_num', key:'valor_num' },
            { header:'valor_den', key:'valor_den' },
            { header:'cobertura_pct', key:'cobertura_pct' }
          ],
          rows: metricas,
          autoFilter:true
        }
      ]
    });

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="produccion_${desde}_${hasta}.xlsx"`
    }).send(buffer);
  } catch (err) { next(err); }
};

/* ---------- CSV raw ---------- */
const WHITELIST = new Set([
  'eventos','metrica_mensual','dashboard_coberturas',
  'stock_movimientos','stock_actual'
]);

export const rawCsv = async (req, res, next) => {
  try {
    const { from, cols = '*', where, order, limit = 50000 } = req.query;
    if (!WHITELIST.has(from)) {
      return res.status(400).json({ error:'BadRequest', message:'Tabla no permitida' });
    }

    /* — Validación MUY sencilla del where: campo op valor (AND soportado) — */
    const safeWhere = (where || '').split(/\s+AND\s+/i).every(clause =>
      /^[\w.]+ *(=|>=|<=|>|<|!=) *[\w'":-]+$/.test(clause.trim())
    );
    if (!safeWhere) return res.status(400).json({ error:'BadRequest', message:'where inválido' });

    const sql = `
      SELECT ${cols}
        FROM ${from}
       ${where ? 'WHERE ' + where : ''}
       ${order ? 'ORDER BY ' + order : ''}
       LIMIT ${Number(limit)};`;

    const csvBuf = await exportCsv({ sql });
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${from}_${Date.now()}.csv"`
    }).send(csvBuf);
  } catch (err) { next(err); }
};
