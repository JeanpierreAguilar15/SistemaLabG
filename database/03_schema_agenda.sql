-- =====================================================
-- ESQUEMA: agenda
-- Tablas para gestión de citas y turnos
-- =====================================================

\c laboratorio_franz_db

-- =====================================================
-- TABLA: agenda.servicio
-- Servicios disponibles para agendar
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.servicio (
    codigo_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    duracion_estimada_minutos INTEGER NOT NULL DEFAULT 30,
    requiere_preparacion BOOLEAN NOT NULL DEFAULT false,
    instrucciones_preparacion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP,

    CONSTRAINT duracion_valida CHECK (duracion_estimada_minutos > 0)
);

COMMENT ON TABLE agenda.servicio IS 'Servicios disponibles para agendar citas';

-- =====================================================
-- TABLA: agenda.sede
-- Sedes del laboratorio
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.sede (
    codigo_sede SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE agenda.sede IS 'Sedes/sucursales del laboratorio';

-- =====================================================
-- TABLA: agenda.horario_atencion
-- Horarios de atención por servicio y sede
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.horario_atencion (
    codigo_horario SERIAL PRIMARY KEY,
    codigo_servicio INTEGER NOT NULL REFERENCES agenda.servicio(codigo_servicio),
    codigo_sede INTEGER NOT NULL REFERENCES agenda.sede(codigo_sede),

    -- Día de la semana (1=Lunes, 7=Domingo)
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),

    -- Horarios
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    -- Capacidad
    cupos_por_hora INTEGER NOT NULL DEFAULT 4,

    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT horario_valido CHECK (hora_fin > hora_inicio)
);

COMMENT ON TABLE agenda.horario_atencion IS 'Horarios de atención por servicio, sede y día de semana';

CREATE INDEX idx_horario_servicio_sede ON agenda.horario_atencion(codigo_servicio, codigo_sede);

-- =====================================================
-- TABLA: agenda.dia_no_laborable
-- Feriados y días no laborables
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.dia_no_laborable (
    codigo_dia_no_laborable SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    descripcion VARCHAR(200) NOT NULL,
    tipo VARCHAR(50), -- FERIADO_NACIONAL, FERIADO_LOCAL, MANTENIMIENTO
    codigo_sede INTEGER REFERENCES agenda.sede(codigo_sede), -- NULL = todas las sedes
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE agenda.dia_no_laborable IS 'Feriados y días no laborables (por sede o general)';

CREATE INDEX idx_dia_no_laborable_fecha ON agenda.dia_no_laborable(fecha);

-- =====================================================
-- TABLA: agenda.slot
-- Slots/espacios de tiempo disponibles para citas
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.slot (
    codigo_slot SERIAL PRIMARY KEY,
    codigo_servicio INTEGER NOT NULL REFERENCES agenda.servicio(codigo_servicio),
    codigo_sede INTEGER NOT NULL REFERENCES agenda.sede(codigo_sede),

    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    cupos_totales INTEGER NOT NULL DEFAULT 1,
    cupos_disponibles INTEGER NOT NULL DEFAULT 1,

    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT cupos_validos CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= cupos_totales),
    CONSTRAINT horario_slot_valido CHECK (hora_fin > hora_inicio)
);

COMMENT ON TABLE agenda.slot IS 'Slots de tiempo disponibles para agendar citas';

CREATE INDEX idx_slot_fecha ON agenda.slot(fecha);
CREATE INDEX idx_slot_servicio_sede_fecha ON agenda.slot(codigo_servicio, codigo_sede, fecha);
CREATE INDEX idx_slot_disponibles ON agenda.slot(cupos_disponibles) WHERE cupos_disponibles > 0 AND activo = true;

-- =====================================================
-- TABLA: agenda.cita
-- Citas agendadas
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.cita (
    codigo_cita SERIAL PRIMARY KEY,
    codigo_slot INTEGER NOT NULL REFERENCES agenda.slot(codigo_slot),
    codigo_paciente INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario),

    -- Estado de la cita
    estado VARCHAR(50) NOT NULL DEFAULT 'AGENDADA',
    -- Estados: AGENDADA, CONFIRMADA, EN_PROCESO, COMPLETADA, CANCELADA, NO_ASISTIO

    -- Información adicional
    observaciones TEXT,
    motivo_cancelacion TEXT,
    fecha_cancelacion TIMESTAMP,
    cancelado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    -- Confirmación
    confirmada BOOLEAN NOT NULL DEFAULT false,
    fecha_confirmacion TIMESTAMP,

    -- Auditoría
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    CONSTRAINT estado_cita_valido CHECK (estado IN ('AGENDADA', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'))
);

COMMENT ON TABLE agenda.cita IS 'Citas agendadas por los pacientes';
COMMENT ON COLUMN agenda.cita.estado IS 'Estados: AGENDADA, CONFIRMADA, EN_PROCESO, COMPLETADA, CANCELADA, NO_ASISTIO';

CREATE INDEX idx_cita_paciente ON agenda.cita(codigo_paciente);
CREATE INDEX idx_cita_slot ON agenda.cita(codigo_slot);
CREATE INDEX idx_cita_estado ON agenda.cita(estado);
CREATE INDEX idx_cita_fecha_creacion ON agenda.cita(fecha_creacion);

-- =====================================================
-- TABLA: agenda.recordatorio
-- Recordatorios de citas enviados
-- =====================================================
CREATE TABLE IF NOT EXISTS agenda.recordatorio (
    codigo_recordatorio SERIAL PRIMARY KEY,
    codigo_cita INTEGER NOT NULL REFERENCES agenda.cita(codigo_cita) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- EMAIL, SMS, PUSH
    enviado BOOLEAN NOT NULL DEFAULT false,
    fecha_envio TIMESTAMP,
    fecha_programada TIMESTAMP NOT NULL,
    error TEXT,

    CONSTRAINT tipo_recordatorio_valido CHECK (tipo IN ('EMAIL', 'SMS', 'PUSH'))
);

COMMENT ON TABLE agenda.recordatorio IS 'Recordatorios de citas enviados a pacientes';

CREATE INDEX idx_recordatorio_cita ON agenda.recordatorio(codigo_cita);
CREATE INDEX idx_recordatorio_programado ON agenda.recordatorio(fecha_programada) WHERE NOT enviado;

-- =====================================================
-- DATOS INICIALES: Sede principal
-- =====================================================
INSERT INTO agenda.sede (nombre, direccion, telefono, activo) VALUES
    ('Sede Principal', 'Av. Principal 123, Riobamba, Ecuador', '032961234', true)
ON CONFLICT DO NOTHING;
