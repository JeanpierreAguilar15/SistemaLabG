CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS lab;
SET search_path TO lab, public;

-- 1) Seguridad
CREATE TABLE IF NOT EXISTS roles (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
nombre varchar(50) UNIQUE NOT NULL,
descripcion varchar(200),
creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
correo varchar(150) UNIQUE NOT NULL,
hash_contrasena text NOT NULL,
nombre varchar(100),
apellido varchar(100),
fecha_nacimiento date,
telefono varchar(30),
cedula varchar(50) UNIQUE, -- clave de negocio
activo boolean NOT NULL DEFAULT true,
creado_en timestamptz NOT NULL DEFAULT now(),
actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuario_roles (
usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
rol_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
asignado_en timestamptz NOT NULL DEFAULT now(),
PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS sesiones_usuario (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
info_dispositivo varchar(200),
token_refresco text,
ip inet,
expira_en timestamptz,
revocado_en timestamptz,
creado_en timestamptz NOT NULL DEFAULT now()
);

-- Restablecimientos de contraseña (para /auth/recuperar)
CREATE TABLE IF NOT EXISTS restablecimientos_contrasena (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
token text NOT NULL,
usado_en timestamptz,
expira_en timestamptz NOT NULL,
creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rest_token ON restablecimientos_contrasena(token);

CREATE TABLE IF NOT EXISTS registros_auditoria (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
actor_id uuid REFERENCES usuarios(id),
accion varchar(80) NOT NULL,
entidad_tipo varchar(80),
entidad_id uuid,
detalles jsonb,
creado_en timestamptz NOT NULL DEFAULT now()
);

-- 2) Servicios/cotizaciones
CREATE TABLE IF NOT EXISTS servicios (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
codigo varchar(50) UNIQUE NOT NULL,
nombre varchar(150) NOT NULL,
categoria varchar(100),
descripcion text,
precio_base numeric(12,2) NOT NULL DEFAULT 0,
activo boolean NOT NULL DEFAULT true,
creado_en timestamptz NOT NULL DEFAULT now(),
actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cotizaciones (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid REFERENCES usuarios(id),
monto_total numeric(12,2) NOT NULL DEFAULT 0,
moneda varchar(10) NOT NULL DEFAULT 'USD',
estado varchar(20) NOT NULL DEFAULT 'borrador',
creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cotizacion_items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
cotizacion_id uuid NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
servicio_id uuid NOT NULL REFERENCES servicios(id),
cantidad integer NOT NULL DEFAULT 1,
precio_unitario numeric(12,2) NOT NULL,
precio_total numeric(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- 3) Turnos
CREATE TABLE IF NOT EXISTS sedes (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
nombre varchar(120) NOT NULL,
direccion varchar(200),
telefono varchar(30),
activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS horarios (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
sede_id uuid NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
servicio_id uuid REFERENCES servicios(id),
dia_semana smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
hora_inicio time NOT NULL,
hora_fin time NOT NULL,
capacidad integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS turnos (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
sede_id uuid NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
servicio_id uuid NOT NULL REFERENCES servicios(id),
fecha_hora timestamptz NOT NULL,
estado varchar(20) NOT NULL DEFAULT 'pendiente',
creado_en timestamptz NOT NULL DEFAULT now(),
actualizado_en timestamptz NOT NULL DEFAULT now(),
motivo_cancelacion varchar(200)
);

-- 4) Pagos y resultados
CREATE TABLE IF NOT EXISTS pagos (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid REFERENCES usuarios(id),
cotizacion_id uuid REFERENCES cotizaciones(id),
monto numeric(12,2) NOT NULL,
moneda varchar(10) NOT NULL DEFAULT 'USD',
metodo varchar(30) NOT NULL,
estado varchar(20) NOT NULL DEFAULT 'pendiente',
referencia_externa varchar(120),
creado_en timestamptz NOT NULL DEFAULT now(),
actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resultados (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
turno_id uuid REFERENCES turnos(id) ON DELETE SET NULL,
servicio_id uuid NOT NULL REFERENCES servicios(id),
url_archivo text NOT NULL,
estado varchar(20) NOT NULL DEFAULT 'en_proceso',
firmado_por uuid REFERENCES usuarios(id),
firmado_en timestamptz,
creado_en timestamptz NOT NULL DEFAULT now()
);

-- 5) Inventario básico
CREATE TABLE IF NOT EXISTS unidades (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
codigo varchar(20) UNIQUE NOT NULL,
nombre varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS proveedores (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
razon_social varchar(150) NOT NULL,
ruc_nit varchar(30) UNIQUE NOT NULL,
contacto varchar(120),
telefono varchar(30),
correo varchar(120),
direccion varchar(200),
activo boolean NOT NULL DEFAULT true,
creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
codigo varchar(50) UNIQUE NOT NULL,
nombre varchar(150) NOT NULL,
unidad_id uuid NOT NULL REFERENCES unidades(id),
categoria varchar(100),
proveedor_id uuid REFERENCES proveedores(id),
existencia_total numeric(14,3) NOT NULL DEFAULT 0,
activo boolean NOT NULL DEFAULT true,
creado_en timestamptz NOT NULL DEFAULT now(),
actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS almacenes (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
nombre varchar(100) NOT NULL,
sede_id uuid REFERENCES sedes(id)
);

CREATE TABLE IF NOT EXISTS ordenes_compra (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
numero varchar(30) UNIQUE NOT NULL,
proveedor_id uuid NOT NULL REFERENCES proveedores(id),
estado varchar(20) NOT NULL DEFAULT 'borrador',
moneda varchar(10) NOT NULL DEFAULT 'USD',
notas text,
creado_por uuid REFERENCES usuarios(id),
creado_en timestamptz NOT NULL DEFAULT now(),
actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orden_compra_detalle (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
orden_compra_id uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
item_id uuid NOT NULL REFERENCES items(id),
descripcion text,
cantidad numeric(14,3) NOT NULL,
precio_unitario numeric(12,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS lotes (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
codigo_lote varchar(80),
fecha_caducidad date,
UNIQUE (item_id, codigo_lote)
);

CREATE TABLE IF NOT EXISTS movimientos_stock (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
almacen_id uuid NOT NULL REFERENCES almacenes(id),
lote_id uuid,
tipo_movimiento varchar(12) NOT NULL,
cantidad numeric(14,3) NOT NULL,
costo_unitario numeric(12,4),
costo_total numeric(14,4),
referencia varchar(120),
motivo varchar(80),
ocurrido_en timestamptz NOT NULL DEFAULT now(),
creado_por uuid REFERENCES usuarios(id)
);

-- 6) Chat
CREATE TABLE IF NOT EXISTS conversaciones_chat (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
usuario_id uuid REFERENCES usuarios(id),
estado varchar(20) NOT NULL DEFAULT 'bot',
iniciado_en timestamptz NOT NULL DEFAULT now(),
cerrado_en timestamptz
);

CREATE TABLE IF NOT EXISTS mensajes_chat (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
conversacion_id uuid NOT NULL REFERENCES conversaciones_chat(id) ON DELETE CASCADE,
tipo_remitente varchar(10) NOT NULL,
remitente_id uuid REFERENCES usuarios(id),
contenido text NOT NULL,
creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escalamientos_chat (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
conversacion_id uuid NOT NULL REFERENCES conversaciones_chat(id) ON DELETE CASCADE,
escalado_a uuid REFERENCES usuarios(id),
creado_en timestamptz NOT NULL DEFAULT now()
);

-- Índices y trigger
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario ON turnos(usuario_id);

CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS trigger AS $$
BEGIN
NEW.actualizado_en = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_actualizado ON usuarios;
CREATE TRIGGER trg_usuarios_actualizado BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE PROCEDURE set_actualizado_en();