/* Manejo de refresh-tokens */
import { pool } from '../config/db.js';

export const saveRefresh = async (userId, token) => {
  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [userId, token]
  );
};

export const getRefresh = async (token) => {
  const [rows] = await pool.execute(
    `SELECT token_id, user_id, revoked, expires_at
       FROM refresh_tokens
      WHERE token = ?`,
    [token]
  );
  return rows[0];
};

export const revokeRefresh = async (token) => {
  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [token]);
}; 