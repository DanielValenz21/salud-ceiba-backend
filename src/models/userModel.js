import { pool } from '../config/db.js';

export const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT user_id, password_hash, role_id FROM usuarios WHERE email = ? AND activo = 1',
    [email]
  );
  return rows[0];
};

export const insertUser = async (user) => {
  const { role_id, nombre, email, password_hash, persona_id } = user;
  const [result] = await pool.execute(
    `INSERT INTO usuarios (role_id, nombre, email, password_hash, persona_id)
     VALUES (?, ?, ?, ?, ?)`,
    [role_id, nombre, email, password_hash, persona_id]
  );
  return result.insertId;
}; 