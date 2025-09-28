-- Amplía la columna `codigo` en la tabla `territorios` a VARCHAR(50)
-- Útil si se desea permitir códigos más largos que los actuales (p. ej. antes VARCHAR(2)).
-- Ejecutar en MySQL/MariaDB con el usuario que tenga permisos de ALTER TABLE:
-- mysql -u <user> -p -h <host> <database> < 001_alter_territorios_codigo_varchar50.sql

ALTER TABLE territorios
  MODIFY COLUMN codigo VARCHAR(50) NOT NULL;
