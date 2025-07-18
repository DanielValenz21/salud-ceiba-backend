import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findByEmail, insertUser } from '../models/userModel.js';
import { saveRefresh, getRefresh, revokeRefresh } from '../models/refreshModel.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 12);
    const userId = await insertUser({ ...req.body, password_hash: hash });
    res.locals.pk = userId;
    res.status(201).json({ user_id: userId });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const user = await findByEmail(req.body.email);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(req.body.password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Credenciales inválidas' });
    }

    const payload = { user_id: user.user_id, role: user.role_id };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await saveRefresh(user.user_id, refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const stored = await getRefresh(refreshToken);

    if (!stored || stored.revoked) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Refresh token inválido' });
    }
    if (new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Refresh token expirado' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = signAccessToken({ user_id: payload.user_id, role: payload.role });

    res.json({ accessToken });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await revokeRefresh(refreshToken);
    res.json({ message: 'Sesión terminada' });
  } catch (err) { next(err); }
}; 