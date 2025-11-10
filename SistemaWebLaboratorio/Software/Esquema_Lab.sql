BEGIN;

-- Schemas (no usar public)
CREATE SCHEMA IF NOT EXISTS usuario;
CREATE SCHEMA IF NOT EXISTS agenda;
CREATE SCHEMA IF NOT EXISTS resultados;
CREATE SCHEMA IF NOT EXISTS facturacion;
CREATE SCHEMA IF NOT EXISTS inventario;
CREATE SCHEMA IF NOT EXISTS auditoria;

-- ===========================================
-- =============== USUARIO ===================
-- ===========================================

-- Tabla central de personas del sistema.
CREATE TABLE usuario.usuarios (
  cedula VARCHAR(20) PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  password_hash TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario.roles (
  nombre_rol TEXT PRIMARY KEY
);

CREATE TABLE usuario.usuario_rol (
  cedula VARCHAR(20) NOT NULL,
  nombre_rol TEXT NOT NULL,
  PRIMARY KEY (cedula, nombre_rol),
  CONSTRAINT fk_usuario_rol_usuario
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_rol_rol
    FOREIGN KEY (nombre_rol) REFERENCES usuario.roles(nombre_rol) ON DELETE RESTRICT
);

CREATE TABLE usuario.sesiones (
  token_id BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  expira_en TIMESTAMPTZ NOT NULL,
  revocado_en TIMESTAMPTZ NULL,
  ip_origen TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sesion_usuario
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

CREATE TABLE usuario.tokens_recuperacion (
  token_reset_id BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  token_hash TEXT NOT NULL,
  expira_en TIMESTAMPTZ NOT NULL,
  usado_en TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_tokenrec_usuario
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

CREATE TABLE usuario.perfil_paciente (
  cedula VARCHAR(20) PRIMARY KEY,
  direccion TEXT,
  contacto_emergencia_nombre TEXT,
  contacto_emergencia_telefono TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_perfilpac_usuario
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

CREATE TABLE usuario.consentimientos (
  consentimiento_id BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  tipo_consentimiento TEXT NOT NULL,
  version_texto TEXT NOT NULL,
  aceptado BOOLEAN NOT NULL,
  aceptado_en TIMESTAMPTZ NOT NULL,
  valido_hasta TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_consent_usuario
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

-- Garantiza upsert por (cedula, tipo_consentimiento) usado en backend
CREATE UNIQUE INDEX IF NOT EXISTS uq_consentimiento
  ON usuario.consentimientos (cedula, tipo_consentimiento);

-- ===========================================
-- ================ AGENDA ===================
-- ===========================================

CREATE TABLE agenda.servicio (
  codigo_servicio TEXT PRIMARY KEY,
  nombre_servicio TEXT NOT NULL,
  categoria TEXT NOT NULL,
  duracion_min INT NOT NULL CHECK (duracion_min > 0),
  instrucciones_preparacion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Infraestructura de sedes para agenda.
CREATE TABLE agenda.sede (
  codigo_sede TEXT PRIMARY KEY,
  nombre_sede TEXT NOT NULL,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feriados (para no generar disponibilidad en dias no laborables)
CREATE TABLE IF NOT EXISTS agenda.feriado (
  fecha DATE PRIMARY KEY,
  nombre TEXT NOT NULL,
  ambito TEXT NOT NULL DEFAULT 'NACIONAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice util por fecha
CREATE INDEX IF NOT EXISTS idx_feriado_fecha ON agenda.feriado (fecha);

-- Configuracion de horario semanal (0=domingo .. 6=sabado)
CREATE TABLE IF NOT EXISTS agenda.horario_config (
  day_of_week INT PRIMARY KEY,
  inicio_m1 TIME,
  fin_m1 TIME,
  inicio_m2 TIME,
  fin_m2 TIME,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Semilla de horario por defecto
INSERT INTO agenda.horario_config (day_of_week, inicio_m1, fin_m1, inicio_m2, fin_m2, activo)
VALUES
  (0, '07:00', '12:00', NULL, NULL, TRUE),
  (1, '07:00', '12:00', '14:00', '17:00', TRUE),
  (2, '07:00', '12:00', '14:00', '17:00', TRUE),
  (3, '07:00', '12:00', '14:00', '17:00', TRUE),
  (4, '07:00', '12:00', '14:00', '17:00', TRUE),
  (5, '07:00', '12:00', '14:00', '17:00', TRUE),
  (6, '07:00', '12:00', '14:00', '17:00', TRUE)
ON CONFLICT (day_of_week) DO NOTHING;

CREATE TABLE agenda.slot_disponible (
  slot_id BIGSERIAL PRIMARY KEY,
  codigo_servicio TEXT NOT NULL,
  codigo_sede TEXT NOT NULL,
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ NOT NULL,
  cupo_total INT NOT NULL CHECK (cupo_total >= 0),
  cupo_reservado INT NOT NULL DEFAULT 0 CHECK (cupo_reservado >= 0),
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_slot_servicio
    FOREIGN KEY (codigo_servicio) REFERENCES agenda.servicio(codigo_servicio) ON DELETE RESTRICT,
  CONSTRAINT fk_slot_sede
    FOREIGN KEY (codigo_sede) REFERENCES agenda.sede(codigo_sede) ON DELETE RESTRICT,
  CONSTRAINT chk_slot_intervalo CHECK (fin > inicio),
  CONSTRAINT chk_slot_capacidad CHECK (cupo_reservado <= cupo_total)
);

-- Evita duplicados del mismo tramo por servicio/sede
CREATE UNIQUE INDEX IF NOT EXISTS uq_slot
  ON agenda.slot_disponible (codigo_servicio, codigo_sede, inicio, fin);

CREATE TABLE agenda.cita (
  numero_cita BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  codigo_servicio TEXT NOT NULL,
  slot_id BIGINT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('CONFIRMADA','PENDIENTE','COMPLETADA','CANCELADA')),
  motivo_cancelacion TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_cita_paciente
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT,
  CONSTRAINT fk_cita_servicio
    FOREIGN KEY (codigo_servicio) REFERENCES agenda.servicio(codigo_servicio) ON DELETE RESTRICT,
  CONSTRAINT fk_cita_slot
    FOREIGN KEY (slot_id) REFERENCES agenda.slot_disponible(slot_id) ON DELETE RESTRICT
);

-- Índice de búsqueda por paciente y estado para agenda
CREATE INDEX idx_cita_cedula_estado ON agenda.cita (cedula, estado);

-- ===========================================
-- ============== RESULTADOS =================
-- ===========================================

CREATE TABLE resultados.prueba_lab (
  codigo_prueba TEXT PRIMARY KEY,
  nombre_prueba TEXT NOT NULL,
  categoria TEXT NOT NULL,
  codigo_interno TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resultados.orden_lab (
  numero_orden BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('EN_PROCESO','COMPLETADO')),
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_orden_paciente
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

CREATE TABLE resultados.resultado_lab (
  codigo_resultado BIGSERIAL PRIMARY KEY,
  numero_orden BIGINT NOT NULL,
  codigo_prueba TEXT NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('EN_PROCESO','COMPLETADO')),
  id_muestra TEXT NOT NULL,
  fecha_resultado DATE,
  pdf_url TEXT,
  pdf_hash TEXT,
  interpretacion_preliminar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_resultado_orden
    FOREIGN KEY (numero_orden) REFERENCES resultados.orden_lab(numero_orden) ON DELETE RESTRICT,
  CONSTRAINT fk_resultado_prueba
    FOREIGN KEY (codigo_prueba) REFERENCES resultados.prueba_lab(codigo_prueba) ON DELETE RESTRICT,
  CONSTRAINT fk_resultado_paciente
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

CREATE TABLE resultados.lectura_resultado (
  lectura_id BIGSERIAL PRIMARY KEY,
  codigo_resultado BIGINT NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  visto_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_origen TEXT,
  user_agent TEXT,
  CONSTRAINT fk_lectura_resultado
    FOREIGN KEY (codigo_resultado) REFERENCES resultados.resultado_lab(codigo_resultado) ON DELETE RESTRICT,
  CONSTRAINT fk_lectura_usuario
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

-- Índice de búsqueda por paciente, prueba y fecha de resultado
CREATE INDEX idx_resultado_cedula_prueba_fecha
  ON resultados.resultado_lab (cedula, codigo_prueba, fecha_resultado);

-- ===========================================
-- ============== FACTURACION ================
-- ===========================================

CREATE TABLE facturacion.cotizacion (
  numero_cotizacion BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('BORRADOR','FINAL','EXPIRADA')),
  version INT NOT NULL DEFAULT 1 CHECK (version > 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  impuesto_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (impuesto_total >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_cotizacion_paciente
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

CREATE TABLE facturacion.cotizacion_item (
  item_id BIGSERIAL PRIMARY KEY,
  numero_cotizacion BIGINT NOT NULL,
  codigo_prueba TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  CONSTRAINT fk_cotizacionitem_cotizacion
    FOREIGN KEY (numero_cotizacion) REFERENCES facturacion.cotizacion(numero_cotizacion) ON DELETE RESTRICT,
  CONSTRAINT fk_cotizacionitem_prueba
    FOREIGN KEY (codigo_prueba) REFERENCES resultados.prueba_lab(codigo_prueba) ON DELETE RESTRICT
);

CREATE TABLE facturacion.factura (
  numero_factura BIGSERIAL PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  numero_cotizacion BIGINT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE','PAGADO','VENCIDO','ANULADO')),
  monto_total NUMERIC(10,2) NOT NULL CHECK (monto_total >= 0),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMPTZ NULL,
  comprobante_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_factura_paciente
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT,
  CONSTRAINT fk_factura_cotizacion
    FOREIGN KEY (numero_cotizacion) REFERENCES facturacion.cotizacion(numero_cotizacion) ON DELETE RESTRICT
);

CREATE TABLE facturacion.pago (
  numero_pago BIGSERIAL PRIMARY KEY,
  numero_factura BIGINT NOT NULL,
  referencia_pasarela TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('APROBADO','RECHAZADO','PENDIENTE')),
  monto_pagado NUMERIC(10,2) NOT NULL CHECK (monto_pagado >= 0),
  pagado_en TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_pago_factura
    FOREIGN KEY (numero_factura) REFERENCES facturacion.factura(numero_factura) ON DELETE RESTRICT
);

-- Índice de búsqueda por paciente y estado para facturas
CREATE INDEX idx_factura_cedula_estado ON facturacion.factura (cedula, estado);

-- ===========================================
-- =============== INVENTARIO ================
-- ===========================================

CREATE TABLE inventario.insumo (
  codigo_insumo TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL,
  unidad_medida TEXT NOT NULL,
  presentacion TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventario.lote_inventario (
  lote_id BIGSERIAL PRIMARY KEY,
  codigo_insumo TEXT NOT NULL,
  numero_lote TEXT NOT NULL,
  fecha_caducidad DATE,
  ubicacion TEXT,
  cantidad_actual NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_lote_insumo
    FOREIGN KEY (codigo_insumo) REFERENCES inventario.insumo(codigo_insumo) ON DELETE RESTRICT
);

CREATE TABLE inventario.movimiento_inventario (
  movimiento_id BIGSERIAL PRIMARY KEY,
  lote_id BIGINT NOT NULL,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('ENTRADA','SALIDA')),
  motivo TEXT NOT NULL CHECK (motivo IN ('COMPRA','CONSUMO','TRASPASO','AJUSTE')),
  cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC(10,2),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_mov_lote
    FOREIGN KEY (lote_id) REFERENCES inventario.lote_inventario(lote_id) ON DELETE RESTRICT
);

CREATE TABLE inventario.regla_reposicion (
  regla_id BIGSERIAL PRIMARY KEY,
  codigo_insumo TEXT NOT NULL,
  codigo_sede TEXT NOT NULL,
  nivel_minimo NUMERIC(10,2) NOT NULL CHECK (nivel_minimo >= 0),
  nivel_optimo NUMERIC(10,2),
  proveedor_preferido TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_regla_insumo
    FOREIGN KEY (codigo_insumo) REFERENCES inventario.insumo(codigo_insumo) ON DELETE RESTRICT,
  CONSTRAINT fk_regla_sede
    FOREIGN KEY (codigo_sede) REFERENCES agenda.sede(codigo_sede) ON DELETE RESTRICT
);

CREATE TABLE inventario.conciliacion_compra (
  conciliacion_id BIGSERIAL PRIMARY KEY,
  orden_externa TEXT,
  numero_factura_proveedor TEXT,
  cedula_recibido_por VARCHAR(20),
  recibido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diferencias_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_conci_usuario
    FOREIGN KEY (cedula_recibido_por) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

-- ===========================================
-- =============== AUDITORIA =================
-- ===========================================

CREATE TABLE auditoria.tb_auditoria (
  evento_id BIGSERIAL PRIMARY KEY,
  fecha_evento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cedula VARCHAR(20) NULL,
  modulo TEXT NOT NULL,   -- 'LOGIN','RESULTADOS','PAGOS','INVENTARIO',...
  accion TEXT NOT NULL,   -- 'LOGIN_OK','LOGIN_FALLIDO','VER_RESULTADO','DESCARGAR_PDF',...
  referencia_clave TEXT,  -- ej. numero_cita, codigo_resultado, numero_factura
  descripcion TEXT,
  metadata JSONB,         -- IP, user_agent, etc.
  CONSTRAINT fk_aud_cedula
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

-- Índice de consulta por cedula/modulo/accion/fecha desc
CREATE INDEX idx_auditoria_consulta
  ON auditoria.tb_auditoria (cedula, modulo, accion, fecha_evento DESC);

-- Registro de errores operativos/técnicos. Monitoreo/post-mortem.
CREATE TABLE auditoria.tb_error (
  error_id BIGSERIAL PRIMARY KEY,
  fecha_error TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  origen TEXT NOT NULL,
  mensaje_error TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB,
  cedula VARCHAR(20),
  resuelto BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_error_cedula
    FOREIGN KEY (cedula) REFERENCES usuario.usuarios(cedula) ON DELETE RESTRICT
);

-- ===========================================
-- ========= TRIGGERS DE AUDITORIA ===========
-- ===========================================

-- Función genérica para updated_at
CREATE OR REPLACE FUNCTION auditoria.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Función para impedir UPDATE/DELETE en tablas de auditoría (append-only / no borrado)
CREATE OR REPLACE FUNCTION auditoria.raise_immutable_audit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Operación % no permitida sobre tabla de auditoría %.%', TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME;
  RETURN NULL;
END;
$$;

-- Triggers updated_at (solo donde existe updated_at)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON usuario.usuarios
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON usuario.perfil_paciente
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON agenda.servicio
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON agenda.sede
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON agenda.slot_disponible
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON agenda.cita
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON resultados.prueba_lab
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON resultados.resultado_lab
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON facturacion.cotizacion
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON facturacion.factura
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON inventario.insumo
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON inventario.lote_inventario
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON inventario.regla_reposicion
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON inventario.conciliacion_compra
FOR EACH ROW EXECUTE FUNCTION auditoria.set_updated_at();

-- Triggers de inmutabilidad / no borrado
-- tb_auditoria: no UPDATE ni DELETE (append-only)
CREATE TRIGGER trg_auditoria_no_update BEFORE UPDATE ON auditoria.tb_auditoria
FOR EACH ROW EXECUTE FUNCTION auditoria.raise_immutable_audit();

CREATE TRIGGER trg_auditoria_no_delete BEFORE DELETE ON auditoria.tb_auditoria
FOR EACH ROW EXECUTE FUNCTION auditoria.raise_immutable_audit();

-- tb_error: no DELETE (permitir UPDATE para marcar resuelto)
CREATE TRIGGER trg_error_no_delete BEFORE DELETE ON auditoria.tb_error
FOR EACH ROW EXECUTE FUNCTION auditoria.raise_immutable_audit();

COMMIT;
