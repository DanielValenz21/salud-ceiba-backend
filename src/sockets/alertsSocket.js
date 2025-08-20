import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Inicializa canal WebSocket en /ws/alertas
 *  - Handshake: token vía auth.token ó query ?token=
 *  - Eventos publicados: alert:new, alert:update, alert:resolve
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    path: '/ws/alertas',
    cors: { origin: '*' }
  });

  /* Auth ------------------------------------------------------------ */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Token requerido'));
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) return next(new Error('Token inválido'));
      socket.user = payload;          // {user_id, role, …}
      // socket.join(`terr_${payload.territorio_id}`);
      next();
    });
  });

  io.on('connection', socket => {
    console.log('🔔  WS conectado:', socket.id);
  });

  /* Helper global para emitir desde cualquier módulo */
  io.emitAlert = (event, data) => io.emit(`alert:${event}`, data);
  global.ioAlerts = io;
}
