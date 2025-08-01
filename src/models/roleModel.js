import { pool } from '../config/db.js';

/* Devuelve [{role_id,name}, …] */
export const listRoles = async () => {
  const [rows] = await pool.execute('SELECT role_id,name FROM roles ORDER BY role_id');
  return rows;
};

/* Dado "ADMIN" o 4 => 4  |  retorna null si no existe */
export const resolveRoleId = async (rol) => {
  if (!rol) return null;
  if (/^\d+$/.test(rol)) return Number(rol);

  // Buscar nombre de rol de forma case-insensitive
  const [rows] = await pool.execute(
    'SELECT role_id FROM roles WHERE LOWER(name) = LOWER(?)',
    [rol]
  );
  return rows[0]?.role_id ?? null;
};

/* ¿Queda al menos otro admin activo diferente de userId? */
export const existsOtherActiveAdmin = async (userId = 0) => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM usuarios WHERE role_id=4 AND activo=1 AND user_id <> ?',
    [userId]
  );
  return rows[0].total > 0;
}; 