-- =====================================================
-- ESQUEMA: usuarios
-- Tablas para gestión de usuarios y autenticación
-- =====================================================

\c laboratorio_franz_db

-- =====================================================
-- TABLA: usuarios.rol
-- Roles del sistema (Admin, Paciente, Personal, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios.rol (
    codigo_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    nivel_acceso INTEGER NOT NULL DEFAULT 1, -- Mayor número = más permisos
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP
);

COMMENT ON TABLE usuarios.rol IS 'Roles del sistema con niveles de acceso';
COMMENT ON COLUMN usuarios.rol.codigo_rol IS 'Identificador único del rol';
COMMENT ON COLUMN usuarios.rol.nombre IS 'Nombre del rol (Admin, Paciente, Personal Laboratorio)';
COMMENT ON COLUMN usuarios.rol.nivel_acceso IS 'Nivel de permisos (1=básico, 10=total)';

-- =====================================================
-- TABLA: usuarios.usuario
-- Información de usuarios del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios.usuario (
    codigo_usuario SERIAL PRIMARY KEY,
    cedula VARCHAR(10) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    direccion TEXT,
    fecha_nacimiento DATE,
    genero CHAR(1) CHECK (genero IN ('M', 'F', 'O')),

    -- Contacto de emergencia
    contacto_emergencia_nombre VARCHAR(200),
    contacto_emergencia_telefono VARCHAR(15),

    -- Autenticación
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    cuenta_bloqueada BOOLEAN NOT NULL DEFAULT false,
    fecha_bloqueo TIMESTAMP,
    requiere_cambio_password BOOLEAN NOT NULL DEFAULT false,
    ultimo_cambio_password TIMESTAMP,

    -- Estado y auditoría
    activo BOOLEAN NOT NULL DEFAULT true,
    verificado BOOLEAN NOT NULL DEFAULT false,
    fecha_verificacion TIMESTAMP,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP,
    ultimo_acceso TIMESTAMP,

    -- Metadata
    ip_registro VARCHAR(45),
    user_agent_registro TEXT,

    CONSTRAINT cedula_ecuatoriana CHECK (cedula ~ '^\d{10}$'),
    CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT telefono_valido CHECK (telefono ~ '^(09\d{8}|0[2-7]\d{7})$')
);

COMMENT ON TABLE usuarios.usuario IS 'Usuarios del sistema - pacientes y personal';
COMMENT ON COLUMN usuarios.usuario.cedula IS 'Cédula ecuatoriana (10 dígitos)';
COMMENT ON COLUMN usuarios.usuario.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN usuarios.usuario.salt IS 'Salt para el hash de contraseña';
COMMENT ON COLUMN usuarios.usuario.intentos_fallidos IS 'Contador de intentos de login fallidos';

-- =====================================================
-- TABLA: usuarios.usuario_rol
-- Asignación de roles a usuarios (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios.usuario_rol (
    codigo_usuario INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario) ON DELETE CASCADE,
    codigo_rol INTEGER NOT NULL REFERENCES usuarios.rol(codigo_rol) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asignado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),
    activo BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (codigo_usuario, codigo_rol)
);

COMMENT ON TABLE usuarios.usuario_rol IS 'Relación muchos a muchos entre usuarios y roles';

-- =====================================================
-- TABLA: usuarios.sesion
-- Sesiones activas de usuarios (JWT refresh tokens)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios.sesion (
    codigo_sesion SERIAL PRIMARY KEY,
    codigo_usuario INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    access_token_jti VARCHAR(100), -- JWT ID para invalidación

    -- Información de la sesión
    ip_address VARCHAR(45),
    user_agent TEXT,
    dispositivo VARCHAR(100),
    ubicacion VARCHAR(200),

    -- Control de tiempo
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    ultimo_uso TIMESTAMP,

    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,
    revocado BOOLEAN NOT NULL DEFAULT false,
    fecha_revocacion TIMESTAMP,
    motivo_revocacion VARCHAR(200)
);

COMMENT ON TABLE usuarios.sesion IS 'Sesiones activas y refresh tokens para JWT';
COMMENT ON COLUMN usuarios.sesion.refresh_token IS 'Token de refresco para obtener nuevo access token';
COMMENT ON COLUMN usuarios.sesion.access_token_jti IS 'JWT ID para rastrear y revocar tokens de acceso';

CREATE INDEX idx_sesion_usuario ON usuarios.sesion(codigo_usuario);
CREATE INDEX idx_sesion_refresh_token ON usuarios.sesion(refresh_token);
CREATE INDEX idx_sesion_activo ON usuarios.sesion(activo, revocado);

-- =====================================================
-- TABLA: usuarios.token_recuperacion
-- Tokens para recuperación de contraseña
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios.token_recuperacion (
    codigo_token SERIAL PRIMARY KEY,
    codigo_usuario INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario) ON DELETE CASCADE,
    token VARCHAR(100) UNIQUE NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT false,
    fecha_uso TIMESTAMP,
    ip_solicitud VARCHAR(45),

    CONSTRAINT token_expiracion CHECK (fecha_expiracion > fecha_creacion)
);

COMMENT ON TABLE usuarios.token_recuperacion IS 'Tokens temporales para recuperación de contraseña';

CREATE INDEX idx_token_recuperacion_usuario ON usuarios.token_recuperacion(codigo_usuario);
CREATE INDEX idx_token_recuperacion_token ON usuarios.token_recuperacion(token) WHERE NOT usado;

-- =====================================================
-- TABLA: usuarios.consentimiento
-- Consentimientos del usuario (GDPR, privacidad)
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios.consentimiento (
    codigo_consentimiento SERIAL PRIMARY KEY,
    codigo_usuario INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario) ON DELETE CASCADE,
    tipo_consentimiento VARCHAR(50) NOT NULL, -- USO_DATOS, NOTIFICACIONES, COMPARTIR_INFO
    aceptado BOOLEAN NOT NULL,
    fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version_politica VARCHAR(20),
    ip_consentimiento VARCHAR(45),

    CONSTRAINT tipo_consentimiento_valido CHECK (tipo_consentimiento IN ('USO_DATOS', 'NOTIFICACIONES', 'COMPARTIR_INFO'))
);

COMMENT ON TABLE usuarios.consentimiento IS 'Historial de consentimientos del usuario (GDPR)';
COMMENT ON COLUMN usuarios.consentimiento.tipo_consentimiento IS 'Tipo: USO_DATOS, NOTIFICACIONES, COMPARTIR_INFO';

CREATE INDEX idx_consentimiento_usuario ON usuarios.consentimiento(codigo_usuario);
CREATE INDEX idx_consentimiento_tipo ON usuarios.consentimiento(codigo_usuario, tipo_consentimiento);

-- =====================================================
-- DATOS INICIALES: Roles
-- =====================================================
INSERT INTO usuarios.rol (nombre, descripcion, nivel_acceso) VALUES
    ('ADMIN', 'Administrador del sistema con acceso total', 10),
    ('PERSONAL_LAB', 'Personal del laboratorio (técnicos, encargados)', 7),
    ('MEDICO', 'Médico con acceso a resultados', 5),
    ('PACIENTE', 'Paciente del laboratorio', 1)
ON CONFLICT (nombre) DO NOTHING;

COMMENT ON TABLE usuarios.rol IS 'Roles predefinidos del sistema';
