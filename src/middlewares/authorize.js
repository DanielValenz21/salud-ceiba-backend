/* RBAC y "self" */
export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 4) // 4 = ADMIN
    return res.status(403).json({ error: 'Forbidden', message: 'Se requiere rol ADMIN' });
  next();
};

export const authorizeSelfOrAdmin = (req, res, next) => {
  const isAdmin = req.user?.role === 4;
  if (!isAdmin && Number(req.params.id) !== req.user?.user_id)
    return res.status(403).json({ error: 'Forbidden', message: 'Acceso denegado' });
  next();
}; 