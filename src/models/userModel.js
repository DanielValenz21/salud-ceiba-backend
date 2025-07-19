import { pool } from '../config/db.js';
import { resolveRoleId } from './roleModel.js';

/* Utilidad interna para asegurar enteros */
const toInt = (v, def = 0) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n < 0 ? def : n;
};

/* ► Listado con filtros y paginación */
export const listUsers = async ({ offset, limit, rol, activo, q }) => {
  /* 1. Construir WHERE dinámico */
  const whereParts = ['1=1'];
  const params = [];

  if (rol !== undefined) {
    const roleId = await resolveRoleId(rol);
    if (roleId) {
      whereParts.push('u.role_id = ?');
      params.push(roleId);
    }
  }

  if (activo !== undefined) {
    whereParts.push('u.activo = ?');
    params.push(activo ? 1 : 0);
  }

  if (q) {
    whereParts.push('(u.nombre LIKE ? OR u.email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  const where = 'WHERE ' + whereParts.join(' AND ');

  /* 2. Total para la meta */
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM usuarios u ${where}`,
    params
  );

  /* 3. Datos paginados ------------------------------------------------ */
  const off = toInt(offset);
  const lim = toInt(limit, 20);
  const sql = `
    SELECT u.user_id, u.nombre, u.email, r.name AS rol,
           u.activo, u.creado_en
      FROM usuarios u
      JOIN roles r USING(role_id)
    ${where}
    ORDER BY u.user_id
    LIMIT ${off},${lim}`;          //  ← interpolamos los enteros aquí

  const [rows] = await pool.execute(sql, params);

  return { total, rows };
};

/* ► Detalle por ID */
export const getUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT u.user_id,u.nombre,u.email,r.name AS rol,
            u.activo,u.creado_en,u.persona_id
       FROM usuarios u
       JOIN roles r USING(role_id)
      WHERE u.user_id = ?`,
    [id]
  );
  return rows[0];
};

/* ► Email duplicado */
export const emailExists = async (email, excludeId = 0) => {
  const [rows] = await pool.execute(
    'SELECT 1 FROM usuarios WHERE email = ? AND user_id <> ?',
    [email, excludeId]
  );
  return rows.length > 0;
};

/* ► Insertar */
export const insertUser = async ({
  role_id, nombre, email, password_hash, persona_id = null
}) => {
  const [res] = await pool.execute(
    `INSERT INTO usuarios (role_id,nombre,email,password_hash,persona_id)
     VALUES (?,?,?,?,?)`,
    [role_id, nombre, email, password_hash, persona_id]
  );
  return res.insertId;
};

/* ► Actualizar parcialmente */
export const updateUser = async (id, data) => {
  const fields = [];
  const params = [];

  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return;

  params.push(id);
  await pool.execute(`UPDATE usuarios SET ${fields.join(', ')} WHERE user_id = ?`, params);
};

/* ► Soft-delete */
export const deactivateUser = async (id) => {
  await pool.execute('UPDATE usuarios SET activo=0 WHERE user_id=?', [id]);
};

/* ► Limpiar refresh_tokens */
export const purgeRefreshTokens = async (userId) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

/* ► Buscar por email (login) */
export const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT user_id, password_hash, role_id FROM usuarios WHERE email = ? AND activo = 1',
    [email]
  );
  return rows[0];
}; 