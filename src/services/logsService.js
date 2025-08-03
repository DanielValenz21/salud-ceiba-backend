/**
 * Service to insert logs using an existing MySQL connection.
 * @param {object} conn - MySQL connection with execute method
 * @param {object} log - Log data
 */
export const insertLog = async (conn, log) => {
  const { user_id, accion, recurso, pk_recurso, payload_hash } = log;
  await conn.execute(
    `INSERT INTO logs (user_id, accion, recurso, pk_recurso, payload_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, accion, recurso, pk_recurso, payload_hash]
  );
};
