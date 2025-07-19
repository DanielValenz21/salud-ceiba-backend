import bcrypt from 'bcrypt';
import {
  listUsers,
  getUserById,
  emailExists,
  insertUser,
  updateUser,
  deactivateUser,
  purgeRefreshTokens
} from '../models/userModel.js';
import {
  resolveRoleId,
  existsOtherActiveAdmin
} from '../models/roleModel.js';
import { signAccessToken } from '../utils/jwt.js'; // para reset pass opcional

import crypto from 'crypto';

/* -- GET /users ------------------------------------------------------- */
export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, rol, activo, q } = req.query;
    const { offset } = (await import('../utils/pagination.js')).getPagination(req);

    const { rows, total } = await listUsers({ offset, limit, rol, activo, q });

    res.json({ meta: { page, limit, total }, data: rows });
  } catch (err) { next(err); }
};

/* -- POST /users ------------------------------------------------------ */
export const createUser = async (req, res, next) => {
  try {
    /* Email único */
    if (await emailExists(req.body.email))
      return res.status(400).json({ error: 'BadRequest', message: 'Email duplicado' });

    /* Rol */
    const role_id = await resolveRoleId(req.body.rol);
    if (!role_id)
      return res.status(400).json({ error: 'BadRequest', message: 'Rol inválido' });

    /* Hash */
    const password_hash = await bcrypt.hash(req.body.password, 12);

    const userId = await insertUser({
      ...req.body,
      role_id,
      password_hash
    });

    res.locals.pk = userId;
    res.status(201).json({
      user_id: userId,
      nombre: req.body.nombre,
      email: req.body.email,
      rol: req.body.rol,
      activo: 1
    });
  } catch (err) { next(err); }
};

/* -- GET /users/:id --------------------------------------------------- */
export const getUser = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'NotFound', message: 'Usuario no existe' });
    res.json(user);
  } catch (err) { next(err); }
};

/* -- PUT /users/:id --------------------------------------------------- */
export const editUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    /* ¿Existe el usuario? */
    const current = await getUserById(id);
    if (!current) return res.status(404).json({ error: 'NotFound', message: 'Usuario no existe' });

    /* Email duplicado */
    if (req.body.email && (await emailExists(req.body.email, id)))
      return res.status(400).json({ error: 'BadRequest', message: 'Email duplicado' });

    /* No degradar/eliminar último admin */
    if (current.rol === 'ADMIN') {
      if ((req.body.rol && (await resolveRoleId(req.body.rol)) !== 4) ||
          (req.body.activo === false)) {
        const stillAdmins = await existsOtherActiveAdmin(id);
        if (!stillAdmins)
          return res.status(400).json({ error: 'BadRequest', message: 'No se puede quitar al último ADMIN activo' });
      }
    }

    const data = {};
    if (req.body.nombre) data.nombre = req.body.nombre;
    if (req.body.email)  data.email  = req.body.email;
    if (req.body.rol)    data.role_id = await resolveRoleId(req.body.rol);
    if (req.body.activo !== undefined) data.activo = req.body.activo ? 1 : 0;

    /* Reset password opcional */
    if (req.body.password) {
      data.password_hash = await bcrypt.hash(req.body.password, 12);
      /* Revocar refresh tokens */
      await purgeRefreshTokens(id);
    }

    await updateUser(id, data);
    res.locals.pk = id;

    res.json({ message: 'Usuario actualizado' });
  } catch (err) { next(err); }
};

/* -- DELETE /users/:id  (soft) --------------------------------------- */
export const disableUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'NotFound', message: 'Usuario no existe' });

    if (user.rol === 'ADMIN' && !(await existsOtherActiveAdmin(id)))
      return res.status(400).json({ error: 'BadRequest', message: 'No se puede desactivar al último ADMIN activo' });

    await deactivateUser(id);
    await purgeRefreshTokens(id);
    res.locals.pk = id;

    res.status(204).end();
  } catch (err) { next(err); }
};

/* -- GET /roles ------------------------------------------------------- */
import { listRoles } from '../models/roleModel.js';
export const getRoles = async (_req, res, next) => {
  try {
    const roles = await listRoles();
    res.json(roles);
  } catch (err) { next(err); }
}; 