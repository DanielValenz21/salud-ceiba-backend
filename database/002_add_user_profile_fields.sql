-- Agrega campos de perfil básicos al usuario
ALTER TABLE usuarios
  ADD COLUMN telefono    VARCHAR(30) NULL AFTER email,
  ADD COLUMN avatar_url  VARCHAR(300) NULL AFTER telefono,
  ADD COLUMN puesto      VARCHAR(60) NULL AFTER avatar_url;
