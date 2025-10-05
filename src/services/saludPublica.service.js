import db from '../utils/db.js';

// Utilidades de filtros
function filtroPeriodoEventos(anio, mes) {
  if (!anio) return { where: '', params: [] };
  if (mes && mes !== 'all') {
    return { where: 'AND YEAR(e.fecha_evento)=? AND MONTH(e.fecha_evento)=?', params: [anio, Number(mes)] };
  }
  return { where: 'AND YEAR(e.fecha_evento)=?', params: [anio] };
}

function filtroPeriodoDef(anio, mes) {
  if (!anio) return { where: '', params: [] };
  if (mes && mes !== 'all') {
    return { where: 'AND YEAR(m.fecha_defuncion)=? AND MONTH(m.fecha_defuncion)=?', params: [anio, Number(mes)] };
  }
  return { where: 'AND YEAR(m.fecha_defuncion)=?', params: [anio] };
}

function filtroTerritorioEventos(territorioId) {
  if (!territorioId || territorioId === 'all') return { join: '', where: '', params: [] };
  return { join: 'JOIN sectores s ON e.sector_id = s.sector_id JOIN territorios t ON s.territorio_id = t.territorio_id', where: 'AND t.territorio_id = ?', params: [Number(territorioId)] };
}

function filtroTerritorioDef(territorioId) {
  if (!territorioId || territorioId === 'all') return { where: '', params: [] };
  return { where: 'AND m.territorio_id = ?', params: [Number(territorioId)] };
}

// ---------- Catálogos ----------
export async function getCausas() {
  const [rows] = await db.execute(
    `SELECT causa_id AS id, sigsa_codigo, codigo_icd10, descripcion AS nombre
       FROM causas
      ORDER BY nombre`
  );
  return rows;
}

// Nota: catálogo de territorios ya existe en /api/v1/territorios

// ---------- Períodos disponibles ----------
export async function getAnios(modulo) {
  if (modulo === 'mortalidad') {
    const [rows] = await db.execute(
      `SELECT DISTINCT YEAR(fecha_defuncion) AS anio
         FROM mortalidad_registros
        WHERE fecha_defuncion IS NOT NULL
        ORDER BY anio`
    );
    return rows.map(r => r.anio);
  }
  // morbilidad/ambiente desde eventos + indicadores
  const tipo = modulo === 'ambiente' ? ['ambiental'] : ['morbido', 'epidemio'];
  const [rows] = await db.execute(
    `SELECT DISTINCT YEAR(e.fecha_evento) AS anio
       FROM eventos e
       JOIN indicadores i ON i.ind_id = e.ind_id
      WHERE i.tipo_registro IN (${tipo.map(() => '?').join(',')})
      ORDER BY anio`,
    tipo
  );
  return rows.map(r => r.anio);
}

export async function getMeses(modulo, anio, territorioId = 'all') {
  const params = [];
  let sql;
  if (modulo === 'mortalidad') {
    sql = `SELECT DISTINCT MONTH(m.fecha_defuncion) AS mes
             FROM mortalidad_registros m
            WHERE YEAR(m.fecha_defuncion)=?`;
    params.push(Number(anio));
    if (territorioId && territorioId !== 'all') {
      sql += ' AND m.territorio_id = ?';
      params.push(Number(territorioId));
    }
    sql += ' ORDER BY mes';
    const [rows] = await db.execute(sql, params);
    return rows.map(r => ({ value: r.mes, label: new Date(2000, r.mes - 1, 1).toLocaleString('es', { month: 'long' }) }));
  }

  const tipo = modulo === 'ambiente' ? ['ambiental'] : ['morbido', 'epidemio'];
  const territorio = filtroTerritorioEventos(territorioId);
  sql = `SELECT DISTINCT MONTH(e.fecha_evento) AS mes
           FROM eventos e
           JOIN indicadores i ON i.ind_id = e.ind_id
           ${territorio.join}
          WHERE i.tipo_registro IN (${tipo.map(() => '?').join(',')})
            AND YEAR(e.fecha_evento)=?`;
  const params2 = [...tipo, Number(anio), ...territorio.params];
  if (territorio.where) sql += ` ${territorio.where}`;
  sql += ' ORDER BY mes';
  const [rows] = await db.execute(sql, params2);
  return rows.map(r => ({ value: r.mes, label: new Date(2000, r.mes - 1, 1).toLocaleString('es', { month: 'long' }) }));
}

// ---------- KPIs ----------
export async function getKpiMorbilidad({ territorioId, anio, mes }) {
  const territorio = filtroTerritorioEventos(territorioId);
  let sql = `SELECT COALESCE(SUM(CASE WHEN e.valor_num IS NULL THEN 1 ELSE e.valor_num END), 0) AS total
               FROM eventos e
               JOIN indicadores i ON i.ind_id = e.ind_id
               ${territorio.join}
              WHERE i.tipo_registro IN ('morbido','epidemio')`;
  const p1 = filtroPeriodoEventos(anio, mes);
  const params = [...p1.params, ...territorio.params];
  if (p1.where) sql += ` ${p1.where}`;
  if (territorio.where) sql += ` ${territorio.where}`;
  const [rows] = await db.execute(sql, params);
  return rows[0] || { total: 0 };
}

export async function getKpiMortalidad({ territorioId, anio, mes }) {
  const p1 = filtroPeriodoDef(anio, mes);
  const p2 = filtroTerritorioDef(territorioId);
  let sql = `SELECT COALESCE(SUM(COALESCE(m.defunciones,1)), 0) AS total
               FROM mortalidad_registros m
              WHERE 1=1`;
  if (p1.where) sql += ` ${p1.where}`;
  if (p2.where) sql += ` ${p2.where}`;
  const [rows] = await db.execute(sql, [...p1.params, ...p2.params]);
  return rows[0] || { total: 0 };
}

export async function getKpiAmbiente({ territorioId, anio, mes }) {
  const territorio = filtroTerritorioEventos(territorioId);
  let sql = `SELECT COUNT(*) AS total
               FROM eventos e
               JOIN indicadores i ON i.ind_id = e.ind_id
               ${territorio.join}
              WHERE i.tipo_registro = 'ambiental'`;
  const p1 = filtroPeriodoEventos(anio, mes);
  const params = [...p1.params, ...territorio.params];
  if (p1.where) sql += ` ${p1.where}`;
  if (territorio.where) sql += ` ${territorio.where}`;
  const [rows] = await db.execute(sql, params);
  return rows[0] || { total: 0 };
}

// ---------- Consultas ----------
export async function consultarMorbilidad({ territorioId, anio, mes, causaId }) {
  const territorio = filtroTerritorioEventos(territorioId);
  let sql = `SELECT i.nombre AS causa,
                    COALESCE(t.nombre, 'Todos los territorios') AS territorio,
                    DATE_FORMAT(e.fecha_evento, '%Y-%m') AS periodo,
                    SUM(CASE WHEN e.valor_num IS NULL THEN 1 ELSE e.valor_num END) AS casos
               FROM eventos e
               JOIN indicadores i ON i.ind_id = e.ind_id
               ${territorio.join}
              WHERE i.tipo_registro IN ('morbido','epidemio')`;
  const p1 = filtroPeriodoEventos(anio, mes);
  const params = [...p1.params, ...territorio.params];
  if (p1.where) sql += ` ${p1.where}`;
  if (territorio.where) sql += ` ${territorio.where}`;
  if (causaId && causaId !== 'all') { sql += ' AND i.ind_id = ?'; params.push(Number(causaId)); }
  sql += ' GROUP BY 1,2,3 ORDER BY 3 DESC';
  const [rows] = await db.execute(sql, params);
  const total = rows.reduce((acc, r) => acc + Number(r.casos || 0), 0);
  return { total, rows };
}

export async function consultarMortalidad({ territorioId, anio, mes, causaId }) {
  let sql = `SELECT COALESCE(c.descripcion, 'Todas las causas') AS causa,
                    COALESCE(t.nombre, 'Todos los territorios') AS territorio,
                    DATE_FORMAT(m.fecha_defuncion, '%Y-%m') AS periodo,
                    SUM(COALESCE(m.defunciones,1)) AS defunciones
               FROM mortalidad_registros m
          LEFT JOIN causas c      ON c.causa_id = m.causa_id
          LEFT JOIN territorios t ON t.territorio_id = m.territorio_id
              WHERE 1=1`;
  const p1 = filtroPeriodoDef(anio, mes);
  const p2 = filtroTerritorioDef(territorioId);
  const params = [...p1.params, ...p2.params];
  if (p1.where) sql += ` ${p1.where}`;
  if (p2.where) sql += ` ${p2.where}`;
  if (causaId && causaId !== 'all') { sql += ' AND m.causa_id = ?'; params.push(Number(causaId)); }
  sql += ' GROUP BY 1,2,3 ORDER BY 3 DESC';
  const [rows] = await db.execute(sql, params);
  const total = rows.reduce((acc, r) => acc + Number(r.defunciones || 0), 0);
  return { total, rows };
}

export async function consultarAmbiente({ territorioId, anio, mes, indId }) {
  const territorio = filtroTerritorioEventos(territorioId);
  let sql = `SELECT i.nombre AS metric,
                    COALESCE(t.nombre, 'Todos los territorios') AS territorio,
                    DATE_FORMAT(e.fecha_evento, '%Y-%m') AS periodo,
                    AVG(e.valor_num) AS valor_prom,
                    MIN(e.valor_num) AS valor_min,
                    MAX(e.valor_num) AS valor_max
               FROM eventos e
               JOIN indicadores i ON i.ind_id = e.ind_id
               ${territorio.join}
              WHERE i.tipo_registro = 'ambiental'`;
  const p1 = filtroPeriodoEventos(anio, mes);
  const params = [...p1.params, ...territorio.params];
  if (p1.where) sql += ` ${p1.where}`;
  if (territorio.where) sql += ` ${territorio.where}`;
  if (indId && indId !== 'all') { sql += ' AND i.ind_id = ?'; params.push(Number(indId)); }
  sql += ' GROUP BY 1,2,3 ORDER BY 3 DESC';
  const [rows] = await db.execute(sql, params);
  return { rows };
}
