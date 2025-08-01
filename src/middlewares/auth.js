import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import { authorizeRoles } from './authorize.js';
import { resolveRoleId } from '../models/roleModel.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized', message: 'Token requerido' });

  const token = authHeader.replace('Bearer ', '');
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Unauthorized', message: 'Token inválido' });
    req.user = payload; // {user_id, role}
    next();
  });
}; 
/**
 * Middleware que acepta roles como nombres o IDs y verifica contra req.user.role.
 * Con roles string resuelve su ID y luego compara.
 */
export const requireRole = (...roles) => async (req, res, next) => {
  const userRole = req.user?.role;
  const allowed = [];
  for (const role of roles) {
    if (typeof role === 'string') {
      const id = await resolveRoleId(role);
      if (id != null) allowed.push(id);
    } else if (typeof role === 'number') {
      allowed.push(role);
    }
  }
  if (!allowed.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Rol insuficiente' });
  }
  next();
};