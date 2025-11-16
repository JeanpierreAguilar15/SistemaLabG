-- =====================================================
-- ESQUEMAS: resultados, inventario, comunicaciones, auditoria
-- =====================================================

\c laboratorio_franz_db

-- =====================================================
-- ESQUEMA: resultados
-- Tablas para gestión de resultados de laboratorio
-- =====================================================

CREATE TABLE IF NOT EXISTS resultados.muestra (
    codigo_muestra SERIAL PRIMARY KEY,
    codigo_paciente INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario),
    codigo_cita INTEGER REFERENCES agenda.cita(codigo_cita),

    id_muestra VARCHAR(50) UNIQUE NOT NULL, -- Identificador único de la muestra
    fecha_toma TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_muestra VARCHAR(100), -- Sangre, Orina, etc.

    estado VARCHAR(50) NOT NULL DEFAULT 'RECOLECTADA',
    -- Estados: RECOLECTADA, EN_ANALISIS, PROCESADA, DESCARTADA

    observaciones TEXT,
    tomada_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    CONSTRAINT estado_muestra_valido CHECK (estado IN ('RECOLECTADA', 'EN_ANALISIS', 'PROCESADA', 'DESCARTADA'))
);

COMMENT ON TABLE resultados.muestra IS 'Muestras recolectadas de pacientes';

CREATE INDEX idx_muestra_paciente ON resultados.muestra(codigo_paciente);
CREATE INDEX idx_muestra_id ON resultados.muestra(id_muestra);

CREATE TABLE IF NOT EXISTS resultados.resultado (
    codigo_resultado SERIAL PRIMARY KEY,
    codigo_muestra INTEGER NOT NULL REFERENCES resultados.muestra(codigo_muestra),
    codigo_examen INTEGER NOT NULL REFERENCES catalogo.examen(codigo_examen),

    -- Resultado
    valor_numerico DECIMAL(15, 6),
    valor_texto TEXT,
    unidad_medida VARCHAR(50),

    -- Interpretación
    dentro_rango_normal BOOLEAN,
    nivel VARCHAR(20), -- NORMAL, ALTO, BAJO, CRITICO
    observaciones_tecnicas TEXT,

    -- Valores de referencia específicos
    valor_referencia_min DECIMAL(10, 4),
    valor_referencia_max DECIMAL(10, 4),
    valores_referencia_texto TEXT,

    -- Estado
    estado VARCHAR(50) NOT NULL DEFAULT 'EN_PROCESO',
    -- Estados: EN_PROCESO, COMPLETADO, VALIDADO, LIBERADO

    -- Auditoría
    fecha_resultado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    procesado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),
    validado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),
    fecha_validacion TIMESTAMP,

    -- Archivos
    url_pdf TEXT, -- URL del PDF en S3
    codigo_verificacion VARCHAR(100), -- Código para verificar autenticidad

    CONSTRAINT nivel_valido CHECK (nivel IN ('NORMAL', 'ALTO', 'BAJO', 'CRITICO', NULL)),
    CONSTRAINT estado_resultado_valido CHECK (estado IN ('EN_PROCESO', 'COMPLETADO', 'VALIDADO', 'LIBERADO'))
);

COMMENT ON TABLE resultados.resultado IS 'Resultados de exámenes de laboratorio';

CREATE INDEX idx_resultado_muestra ON resultados.resultado(codigo_muestra);
CREATE INDEX idx_resultado_examen ON resultados.resultado(codigo_examen);
CREATE INDEX idx_resultado_estado ON resultados.resultado(estado);

CREATE TABLE IF NOT EXISTS resultados.descarga_resultado (
    codigo_descarga SERIAL PRIMARY KEY,
    codigo_resultado INTEGER NOT NULL REFERENCES resultados.resultado(codigo_resultado),
    codigo_usuario INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario),

    fecha_descarga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

COMMENT ON TABLE resultados.descarga_resultado IS 'Registro de descargas de resultados (auditoría)';

CREATE INDEX idx_descarga_resultado ON resultados.descarga_resultado(codigo_resultado);
CREATE INDEX idx_descarga_usuario ON resultados.descarga_resultado(codigo_usuario);

-- =====================================================
-- ESQUEMA: inventario
-- Tablas para gestión de inventario
-- =====================================================

CREATE TABLE IF NOT EXISTS inventario.categoria_item (
    codigo_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE inventario.categoria_item IS 'Categorías de items de inventario';

CREATE TABLE IF NOT EXISTS inventario.item (
    codigo_item SERIAL PRIMARY KEY,
    codigo_categoria INTEGER REFERENCES inventario.categoria_item(codigo_categoria),

    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    unidad_medida VARCHAR(50) NOT NULL, -- ml, unidades, gr, etc.

    -- Control de stock
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    stock_maximo INTEGER,

    -- Precio
    costo_unitario DECIMAL(10, 2),
    precio_venta DECIMAL(10, 2),

    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT stock_no_negativo CHECK (stock_actual >= 0),
    CONSTRAINT stock_minimo_no_negativo CHECK (stock_minimo >= 0)
);

COMMENT ON TABLE inventario.item IS 'Items de inventario (reactivos, insumos, etc.)';

CREATE INDEX idx_item_codigo_interno ON inventario.item(codigo_interno);
CREATE INDEX idx_item_categoria ON inventario.item(codigo_categoria);

CREATE TABLE IF NOT EXISTS inventario.lote (
    codigo_lote SERIAL PRIMARY KEY,
    codigo_item INTEGER NOT NULL REFERENCES inventario.item(codigo_item),

    numero_lote VARCHAR(100) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    cantidad_inicial INTEGER NOT NULL,
    cantidad_actual INTEGER NOT NULL,

    proveedor VARCHAR(200),
    fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT cantidad_lote_no_negativa CHECK (cantidad_actual >= 0),
    CONSTRAINT cantidad_inicial_positiva CHECK (cantidad_inicial > 0)
);

COMMENT ON TABLE inventario.lote IS 'Lotes de items de inventario';

CREATE INDEX idx_lote_item ON inventario.lote(codigo_item);
CREATE INDEX idx_lote_vencimiento ON inventario.lote(fecha_vencimiento);

CREATE TABLE IF NOT EXISTS inventario.movimiento (
    codigo_movimiento SERIAL PRIMARY KEY,
    codigo_item INTEGER NOT NULL REFERENCES inventario.item(codigo_item),
    codigo_lote INTEGER REFERENCES inventario.lote(codigo_lote),

    tipo_movimiento VARCHAR(50) NOT NULL, -- ENTRADA, SALIDA, AJUSTE
    cantidad INTEGER NOT NULL,
    motivo TEXT,

    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,

    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    realizado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    CONSTRAINT tipo_movimiento_valido CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE'))
);

COMMENT ON TABLE inventario.movimiento IS 'Movimientos de inventario (entradas/salidas)';

CREATE INDEX idx_movimiento_item ON inventario.movimiento(codigo_item);
CREATE INDEX idx_movimiento_fecha ON inventario.movimiento(fecha_movimiento);

CREATE TABLE IF NOT EXISTS inventario.proveedor (
    codigo_proveedor SERIAL PRIMARY KEY,
    ruc VARCHAR(13) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    telefono VARCHAR(15),
    email VARCHAR(100),
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE inventario.proveedor IS 'Proveedores de reactivos e insumos';

CREATE TABLE IF NOT EXISTS inventario.orden_compra (
    codigo_orden_compra SERIAL PRIMARY KEY,
    codigo_proveedor INTEGER NOT NULL REFERENCES inventario.proveedor(codigo_proveedor),

    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    fecha_orden TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada DATE,
    fecha_entrega_real TIMESTAMP,

    subtotal DECIMAL(10, 2) NOT NULL,
    iva DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    estado VARCHAR(50) NOT NULL DEFAULT 'BORRADOR',
    -- Estados: BORRADOR, EMITIDA, APROBADA, RECIBIDA, CANCELADA

    observaciones TEXT,
    creado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    CONSTRAINT estado_orden_valido CHECK (estado IN ('BORRADOR', 'EMITIDA', 'APROBADA', 'RECIBIDA', 'CANCELADA'))
);

COMMENT ON TABLE inventario.orden_compra IS 'Órdenes de compra a proveedores';

CREATE INDEX idx_orden_compra_proveedor ON inventario.orden_compra(codigo_proveedor);
CREATE INDEX idx_orden_compra_estado ON inventario.orden_compra(estado);

CREATE TABLE IF NOT EXISTS inventario.orden_compra_detalle (
    codigo_detalle SERIAL PRIMARY KEY,
    codigo_orden_compra INTEGER NOT NULL REFERENCES inventario.orden_compra(codigo_orden_compra) ON DELETE CASCADE,
    codigo_item INTEGER NOT NULL REFERENCES inventario.item(codigo_item),

    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    total_linea DECIMAL(10, 2) NOT NULL,

    CONSTRAINT cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT precio_unitario_positivo CHECK (precio_unitario >= 0)
);

COMMENT ON TABLE inventario.orden_compra_detalle IS 'Detalle de items en órdenes de compra';

CREATE INDEX idx_orden_detalle_orden ON inventario.orden_compra_detalle(codigo_orden_compra);

-- =====================================================
-- ESQUEMA: comunicaciones
-- Tablas para chat, agente virtual y notificaciones
-- =====================================================

CREATE TABLE IF NOT EXISTS comunicaciones.conversacion (
    codigo_conversacion SERIAL PRIMARY KEY,
    codigo_usuario INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    tipo VARCHAR(50) NOT NULL, -- BOT, HUMANO
    estado VARCHAR(50) NOT NULL DEFAULT 'ACTIVA',
    -- Estados: ACTIVA, TRANSFERIDA, CERRADA, ARCHIVADA

    -- Transferencia a humano
    transferida_a_humano BOOLEAN NOT NULL DEFAULT false,
    atendido_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),
    fecha_transferencia TIMESTAMP,

    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,

    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,

    CONSTRAINT tipo_conversacion_valido CHECK (tipo IN ('BOT', 'HUMANO')),
    CONSTRAINT estado_conversacion_valido CHECK (estado IN ('ACTIVA', 'TRANSFERIDA', 'CERRADA', 'ARCHIVADA'))
);

COMMENT ON TABLE comunicaciones.conversacion IS 'Conversaciones del agente virtual y chat';

CREATE INDEX idx_conversacion_usuario ON comunicaciones.conversacion(codigo_usuario);
CREATE INDEX idx_conversacion_estado ON comunicaciones.conversacion(estado);

CREATE TABLE IF NOT EXISTS comunicaciones.mensaje (
    codigo_mensaje SERIAL PRIMARY KEY,
    codigo_conversacion INTEGER NOT NULL REFERENCES comunicaciones.conversacion(codigo_conversacion) ON DELETE CASCADE,

    remitente VARCHAR(50) NOT NULL, -- USUARIO, BOT, OPERADOR
    codigo_remitente INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    contenido TEXT NOT NULL,
    tipo_contenido VARCHAR(50) NOT NULL DEFAULT 'TEXTO', -- TEXTO, IMAGEN, ARCHIVO

    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN NOT NULL DEFAULT false,
    fecha_lectura TIMESTAMP,

    -- Metadata del bot
    intent VARCHAR(100), -- Intent detectado por Dialogflow
    confidence DECIMAL(5, 4), -- Confianza del intent (0-1)

    CONSTRAINT remitente_valido CHECK (remitente IN ('USUARIO', 'BOT', 'OPERADOR')),
    CONSTRAINT tipo_contenido_valido CHECK (tipo_contenido IN ('TEXTO', 'IMAGEN', 'ARCHIVO'))
);

COMMENT ON TABLE comunicaciones.mensaje IS 'Mensajes de chat (usuarios, bot, operadores)';

CREATE INDEX idx_mensaje_conversacion ON comunicaciones.mensaje(codigo_conversacion);
CREATE INDEX idx_mensaje_fecha ON comunicaciones.mensaje(fecha_envio);

CREATE TABLE IF NOT EXISTS comunicaciones.notificacion (
    codigo_notificacion SERIAL PRIMARY KEY,
    codigo_usuario INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario),

    tipo VARCHAR(50) NOT NULL, -- EMAIL, SMS, PUSH
    asunto VARCHAR(200),
    contenido TEXT NOT NULL,

    -- Relacionado a
    tipo_referencia VARCHAR(50), -- CITA, RESULTADO, PAGO
    codigo_referencia INTEGER,

    enviada BOOLEAN NOT NULL DEFAULT false,
    fecha_envio TIMESTAMP,
    fecha_programada TIMESTAMP,
    error TEXT,

    CONSTRAINT tipo_notificacion_valido CHECK (tipo IN ('EMAIL', 'SMS', 'PUSH')),
    CONSTRAINT tipo_referencia_valido CHECK (tipo_referencia IN ('CITA', 'RESULTADO', 'PAGO', NULL))
);

COMMENT ON TABLE comunicaciones.notificacion IS 'Notificaciones enviadas a usuarios';

CREATE INDEX idx_notificacion_usuario ON comunicaciones.notificacion(codigo_usuario);
CREATE INDEX idx_notificacion_programada ON comunicaciones.notificacion(fecha_programada) WHERE NOT enviada;

-- =====================================================
-- ESQUEMA: auditoria
-- Tablas para auditoría y trazabilidad
-- =====================================================

CREATE TABLE IF NOT EXISTS auditoria.log_actividad (
    codigo_log SERIAL PRIMARY KEY,
    codigo_usuario INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    accion VARCHAR(100) NOT NULL, -- LOGIN, LOGOUT, CREAR, ACTUALIZAR, ELIMINAR, etc.
    entidad VARCHAR(100), -- Usuario, Cita, Resultado, etc.
    codigo_entidad INTEGER,

    descripcion TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Datos antes/después (JSONB para flexibilidad)
    datos_anteriores JSONB,
    datos_nuevos JSONB,

    fecha_accion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE auditoria.log_actividad IS 'Registro de actividad de usuarios (auditoría)';

CREATE INDEX idx_log_usuario ON auditoria.log_actividad(codigo_usuario);
CREATE INDEX idx_log_fecha ON auditoria.log_actividad(fecha_accion);
CREATE INDEX idx_log_accion ON auditoria.log_actividad(accion);
CREATE INDEX idx_log_entidad ON auditoria.log_actividad(entidad, codigo_entidad);

CREATE TABLE IF NOT EXISTS auditoria.log_error (
    codigo_log_error SERIAL PRIMARY KEY,
    codigo_usuario INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    nivel VARCHAR(20) NOT NULL, -- ERROR, WARNING, CRITICAL
    mensaje TEXT NOT NULL,
    stack_trace TEXT,
    endpoint VARCHAR(200),
    metodo VARCHAR(10), -- GET, POST, PUT, DELETE

    ip_address VARCHAR(45),
    user_agent TEXT,

    fecha_error TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT nivel_error_valido CHECK (nivel IN ('ERROR', 'WARNING', 'CRITICAL'))
);

COMMENT ON TABLE auditoria.log_error IS 'Registro de errores del sistema';

CREATE INDEX idx_log_error_fecha ON auditoria.log_error(fecha_error);
CREATE INDEX idx_log_error_nivel ON auditoria.log_error(nivel);

-- =====================================================
-- DATOS INICIALES: Categorías de inventario
-- =====================================================
INSERT INTO inventario.categoria_item (nombre, descripcion) VALUES
    ('Reactivos', 'Reactivos químicos para análisis'),
    ('Insumos', 'Insumos consumibles (tubos, agujas, etc.)'),
    ('Equipamiento', 'Equipos de laboratorio'),
    ('Calibradores', 'Calibradores y controles de calidad')
ON CONFLICT (nombre) DO NOTHING;
