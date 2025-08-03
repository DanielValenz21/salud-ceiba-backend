import db from '../utils/db.js';

// job simple: recalcular valor_den y refrescar vista dashboard_coberturas
export const updateMetricsForMeta = async (metaId) => {
  try {
    await db.execute('CALL update_metrics_for_meta(?)', [metaId]);
    await db.execute(
      'CREATE OR REPLACE VIEW dashboard_coberturas AS SELECT ind_id, mes, ROUND(valor_num / NULLIF(valor_den,0) * 100,1) AS cobertura_pct FROM metrica_mensual'
    );
  } catch (err) {
    console.error('⚠️  Job updateMetricsForMeta falló:', err.message);
  }
};
