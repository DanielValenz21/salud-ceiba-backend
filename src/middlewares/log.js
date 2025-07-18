import { pool } from '../config/db.js';
import crypto from 'crypto';

export const auditLog = async (req, res, next) => {
  res.on('finish', async () => {
    const { method, originalUrl, user } = req;
    const recurso = originalUrl.split('?')[0].slice(1, 40);
    const pk = res.locals?.pk || null;
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

    await pool.execute(
      `INSERT INTO logs (user_id, accion, recurso, pk_recurso, payload_hash, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user?.user_id || null,
       method === 'POST' ? 'CREATE' : method === 'PUT' ? 'UPDATE' :
       method === 'DELETE' ? 'DELETE' : 'EXPORT',
       recurso,
       pk,
       payloadHash,
       req.ip,
       req.headers['user-agent']]
    );
  });
  next();
}; 