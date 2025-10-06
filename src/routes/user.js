import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  filterSchema,
  createSchema,
  updateSchema,
  updateMeSchema,
  changePasswordSchema
} from '../validators/user.js';
import {
  getUsers,
  createUser,
  getUser,
  editUser,
  disableUser,
  getMe,
  updateMe,
  changeMyPassword
} from '../controllers/userController.js';
import {
  authorizeAdmin,
  authorizeSelfOrAdmin
} from '../middlewares/authorize.js';

const router = Router();

/* Perfil autenticado */
router.get('/me', getMe);
router.put('/me', validate(updateMeSchema), updateMe);
router.put('/me/password', validate(changePasswordSchema), changeMyPassword);

/* GET /users?page&limit&rol&activo&q */
router.get('/', authorizeAdmin, validate(filterSchema), getUsers);

/* POST /users */
router.post('/', authorizeAdmin, validate(createSchema), createUser);

/* GET /users/:id */
router.get('/:id', authorizeSelfOrAdmin, getUser);

/* PUT /users/:id */
router.put('/:id', authorizeAdmin, validate(updateSchema), editUser);

/* DELETE /users/:id */
router.delete('/:id', authorizeAdmin, disableUser);

export default router; 