import { pool } from '../config/db.js';
import { resolveRoleId } from './roleModel.js';

/* ► Listado con filtros y paginación */
export const listUsers = async ({ offset, limit, rol, activo, q }) => {
  const params = [];
  let where = 'WHERE 1=1';

  if (rol !== undefined) {
    const roleId = await resolveRoleId(rol);
    if (roleId) {
      where += ' AND u.role_id = ?';
      params.push(roleId);
    }
  }
  if (activo !== undefined) {
    where += ' AND u.activo = ?';
    params.push(activo ? 1 : 0);
  }
  if (q) {
    where += ' AND (u.nombre LIKE ? OR u.email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  /* Total para meta */
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM usuarios u ${where}`,
    params
  );

  /* Datos */
  params.push(offset, limit);
  const [rows] = await pool.query(
    `SELECT u.user_id,u.nombre,u.email,r.name AS rol,
            u.activo,u.creado_en
       FROM usuarios u
       JOIN roles r USING(role_id)
     ${where}
     ORDER BY u.user_id
     LIMIT ?,?`,
    params
  );
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

/* ► Existe email? (excluyendo opcionalmente un user_id) */
export const emailExists = async (email, excludeId = 0) => {
  const [rows] = await pool.execute(
    'SELECT 1 FROM usuarios WHERE email = ? AND user_id <> ?',
    [email, excludeId]
  );
  return rows.length > 0;
};

/* ► Insertar nuevo usuario (devuelve user_id) */
export const insertUser = async ({
  role_id,
  nombre,
  email,
  password_hash,
  persona_id = null
}) => {
  const [res] = await pool.execute(
    `INSERT INTO usuarios (role_id,nombre,email,password_hash,persona_id)
     VALUES (?,?,?,?,?)`,
    [role_id, nombre, email, password_hash, persona_id]
  );
  return res.insertId;
};

/* ► Actualizar usuario: campos parciales */
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

/* ► Soft-delete (activo = 0) */
export const deactivateUser = async (id) => {
  await pool.execute('UPDATE usuarios SET activo=0 WHERE user_id=?', [id]);
};

/* ► Eliminar refresh tokens de un usuario */
export const purgeRefreshTokens = async (userId) => {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

/* ► Buscar por email (para login) */
export const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT user_id, password_hash, role_id FROM usuarios WHERE email = ? AND activo = 1',
    [email]
  );
  return rows[0];
}; 