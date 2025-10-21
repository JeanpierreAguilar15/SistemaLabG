-- Semillas mínimas para desarrollo (MVP)
SET search_path TO lab, public;

-- 1) Roles
INSERT INTO roles (id, nombre, descripcion) VALUES
(gen_random_uuid(), 'ADMIN', 'Administrador del sistema'),
(gen_random_uuid(), 'LAB', 'Personal del laboratorio'),
(gen_random_uuid(), 'PACIENTE', 'Paciente')
ON CONFLICT (nombre) DO NOTHING;

-- 2) Usuarios base (UUID PK + cédula única)
DO $$
DECLARE
v_admin_id uuid;
v_lab_id uuid;
v_pac_id uuid;
v_pac2_id uuid;
v_admin_rol uuid; v_lab_rol uuid; v_pac_rol uuid;
BEGIN
-- Admin
SELECT id INTO v_admin_id FROM usuarios WHERE correo='admin@demo.com';
IF v_admin_id IS NULL THEN
INSERT INTO usuarios (correo, hash_contrasena, nombre, apellido, telefono, cedula, activo)
VALUES ('admin@demo.com', crypt('admin123', gen_salt('bf')), 'Santiago', 'Herrera', '0990000001', '0101010101', true)
RETURNING id INTO v_admin_id;
END IF;
SELECT id INTO v_admin_rol FROM roles WHERE nombre='ADMIN';
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT v_admin_id, v_admin_rol
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE usuario_id=v_admin_id AND rol_id=v_admin_rol);

-- Personal LAB
SELECT id INTO v_lab_id FROM usuarios WHERE correo='lab@demo.com';
IF v_lab_id IS NULL THEN
INSERT INTO usuarios (correo, hash_contrasena, nombre, apellido, telefono, cedula, activo)
VALUES ('lab@demo.com', crypt('lab123', gen_salt('bf')), 'Ana', 'Torres', '0990000002', '0202020202', true)
RETURNING id INTO v_lab_id;
END IF;
SELECT id INTO v_lab_rol FROM roles WHERE nombre='LAB';
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT v_lab_id, v_lab_rol
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE usuario_id=v_lab_id AND rol_id=v_lab_rol);

-- Paciente demo
SELECT id INTO v_pac_id FROM usuarios WHERE correo='paciente1@demo.com';
IF v_pac_id IS NULL THEN
INSERT INTO usuarios (correo, hash_contrasena, nombre, apellido, telefono, cedula, activo)
VALUES ('paciente1@demo.com', crypt('paciente123', gen_salt('bf')), 'Carlos', 'Díaz', '0990000003', '0303030303', true)
RETURNING id INTO v_pac_id;
END IF;
SELECT id INTO v_pac_rol FROM roles WHERE nombre='PACIENTE';
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT v_pac_id, v_pac_rol
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE usuario_id=v_pac_id AND rol_id=v_pac_rol);

-- Paciente (correo real)
SELECT id INTO v_pac2_id FROM usuarios WHERE correo='reimblox@gmail.com';
IF v_pac2_id IS NULL THEN
INSERT INTO usuarios (correo, hash_contrasena, nombre, apellido, telefono, cedula, activo)
VALUES ('reimblox@gmail.com', crypt('paciente123', gen_salt('bf')), 'Luis', 'Bravo', '0990000004', '0404040404', true)
RETURNING id INTO v_pac2_id;
END IF;
INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT v_pac2_id, v_pac_rol
WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE usuario_id=v_pac2_id AND rol_id=v_pac_rol);
END $$;

-- 3) Servicios
INSERT INTO servicios (codigo, nombre, categoria, descripcion, precio_base, activo)
VALUES
('HEM-001', 'Hemograma Completo', 'Hematología', 'Examen básico', 10.00, true),
('GLU-001', 'Glucosa', 'Bioquímica', 'Glucosa en sangre', 6.50, true)
ON CONFLICT (codigo) DO NOTHING;

-- 4) Sede + horario
INSERT INTO sedes (nombre, direccion, telefono, activo)
VALUES ('Matriz Quito', 'Av. 6 de Diciembre y Colón', '022345678', true)
ON CONFLICT DO NOTHING;

INSERT INTO horarios (sede_id, servicio_id, dia_semana, hora_inicio, hora_fin, capacidad)
SELECT s.id, sv.id, 1, TIME '08:00', TIME '12:00', 10
FROM sedes s, servicios sv
WHERE s.nombre='Matriz Quito' AND sv.codigo='HEM-001'
ON CONFLICT DO NOTHING;

-- 5) Inventario base
INSERT INTO unidades (codigo, nombre) VALUES ('UND', 'Unidad')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO proveedores (razon_social, ruc_nit, contacto, telefono, correo, direccion, activo)
VALUES ('MedSupply Andina Cía. Ltda.', '1790012345001', 'María Pérez', '022345111', 'ventas@medsupply.com', 'Av. Amazonas 100', true)
ON CONFLICT (ruc_nit) DO NOTHING;

INSERT INTO items (codigo, nombre, unidad_id, categoria, proveedor_id, existencia_total, activo)
SELECT 'AG-001', 'Agujas', u.id, 'Insumos', p.id, 100, true
FROM unidades u, proveedores p
WHERE u.codigo='UND' AND p.ruc_nit='1790012345001'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO items (codigo, nombre, unidad_id, categoria, proveedor_id, existencia_total, activo)
SELECT 'GL-001', 'Guantes', u.id, 'Insumos', p.id, 200, true
FROM unidades u, proveedores p
WHERE u.codigo='UND' AND p.ruc_nit='1790012345001'
ON CONFLICT (codigo) DO NOTHING;