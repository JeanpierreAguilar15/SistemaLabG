-- =====================================================
-- ESQUEMA: pagos
-- Tablas para gestión de pagos y cotizaciones
-- =====================================================

\c laboratorio_franz_db

-- =====================================================
-- TABLA: pagos.cotizacion
-- Cotizaciones de servicios
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos.cotizacion (
    codigo_cotizacion SERIAL PRIMARY KEY,
    codigo_paciente INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario),

    -- Información de la cotización
    numero_cotizacion VARCHAR(50) UNIQUE NOT NULL, -- COT-2025-00001
    fecha_cotizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_validez DATE, -- Fecha hasta la cual es válida

    -- Montos
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Estado
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    -- Estados: PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA_A_PAGO, EXPIRADA

    observaciones TEXT,
    fecha_modificacion TIMESTAMP,

    CONSTRAINT subtotal_positivo CHECK (subtotal >= 0),
    CONSTRAINT descuento_valido CHECK (descuento >= 0),
    CONSTRAINT total_valido CHECK (total >= 0),
    CONSTRAINT estado_cotizacion_valido CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CONVERTIDA_A_PAGO', 'EXPIRADA'))
);

COMMENT ON TABLE pagos.cotizacion IS 'Cotizaciones generadas para pacientes';
COMMENT ON COLUMN pagos.cotizacion.numero_cotizacion IS 'Número único de cotización (COT-YYYY-NNNNN)';

CREATE INDEX idx_cotizacion_paciente ON pagos.cotizacion(codigo_paciente);
CREATE INDEX idx_cotizacion_numero ON pagos.cotizacion(numero_cotizacion);
CREATE INDEX idx_cotizacion_estado ON pagos.cotizacion(estado);

-- =====================================================
-- TABLA: pagos.cotizacion_detalle
-- Detalle de exámenes en la cotizacion
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos.cotizacion_detalle (
    codigo_detalle SERIAL PRIMARY KEY,
    codigo_cotizacion INTEGER NOT NULL REFERENCES pagos.cotizacion(codigo_cotizacion) ON DELETE CASCADE,
    codigo_examen INTEGER REFERENCES catalogo.examen(codigo_examen),
    codigo_paquete INTEGER REFERENCES catalogo.paquete(codigo_paquete),

    descripcion VARCHAR(300) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento_linea DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_linea DECIMAL(10, 2) NOT NULL,

    CONSTRAINT cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT precio_unitario_positivo CHECK (precio_unitario >= 0),
    CONSTRAINT total_linea_positivo CHECK (total_linea >= 0),
    CONSTRAINT examen_o_paquete CHECK (
        (codigo_examen IS NOT NULL AND codigo_paquete IS NULL) OR
        (codigo_examen IS NULL AND codigo_paquete IS NOT NULL)
    )
);

COMMENT ON TABLE pagos.cotizacion_detalle IS 'Detalle de items en cada cotización';

CREATE INDEX idx_cotizacion_detalle_cotizacion ON pagos.cotizacion_detalle(codigo_cotizacion);

-- =====================================================
-- TABLA: pagos.pago
-- Pagos realizados
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos.pago (
    codigo_pago SERIAL PRIMARY KEY,
    codigo_cotizacion INTEGER REFERENCES pagos.cotizacion(codigo_cotizacion),
    codigo_paciente INTEGER NOT NULL REFERENCES usuarios.usuario(codigo_usuario),

    -- Información del pago
    numero_pago VARCHAR(50) UNIQUE NOT NULL, -- PAG-2025-00001
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Montos
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_pagado DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Método de pago
    metodo_pago VARCHAR(50) NOT NULL, -- EFECTIVO, TARJETA, TRANSFERENCIA, PASARELA
    referencia_pago VARCHAR(200), -- Referencia del banco o pasarela

    -- Estado
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    -- Estados: PENDIENTE, PROCESANDO, COMPLETADO, FALLIDO, REEMBOLSADO, CANCELADO

    -- Pasarela de pagos (si aplica)
    proveedor_pasarela VARCHAR(100), -- Nombre del proveedor (Stripe, PayPal, etc.)
    id_transaccion_externa VARCHAR(200), -- ID de la transacción en la pasarela
    url_comprobante TEXT, -- URL del comprobante en S3

    fecha_procesamiento TIMESTAMP,
    observaciones TEXT,

    CONSTRAINT monto_total_positivo CHECK (monto_total > 0),
    CONSTRAINT monto_pagado_positivo CHECK (monto_pagado >= 0),
    CONSTRAINT estado_pago_valido CHECK (estado IN ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO', 'CANCELADO')),
    CONSTRAINT metodo_pago_valido CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'PASARELA'))
);

COMMENT ON TABLE pagos.pago IS 'Pagos realizados por los pacientes';
COMMENT ON COLUMN pagos.pago.numero_pago IS 'Número único de pago (PAG-YYYY-NNNNN)';

CREATE INDEX idx_pago_paciente ON pagos.pago(codigo_paciente);
CREATE INDEX idx_pago_numero ON pagos.pago(numero_pago);
CREATE INDEX idx_pago_estado ON pagos.pago(estado);
CREATE INDEX idx_pago_cotizacion ON pagos.pago(codigo_cotizacion);
CREATE INDEX idx_pago_transaccion_externa ON pagos.pago(id_transaccion_externa);

-- =====================================================
-- TABLA: pagos.factura
-- Facturas generadas
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos.factura (
    codigo_factura SERIAL PRIMARY KEY,
    codigo_pago INTEGER NOT NULL REFERENCES pagos.pago(codigo_pago),

    numero_factura VARCHAR(50) UNIQUE NOT NULL, -- FACT-2025-00001
    numero_autorizacion VARCHAR(100), -- Número de autorización del SRI
    fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Datos del cliente
    razon_social VARCHAR(200),
    ruc_cedula VARCHAR(13) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(15),
    email VARCHAR(100),

    -- Montos
    subtotal DECIMAL(10, 2) NOT NULL,
    iva DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    -- Archivos
    url_xml TEXT, -- URL del XML (SRI)
    url_pdf TEXT, -- URL del PDF

    estado VARCHAR(50) NOT NULL DEFAULT 'EMITIDA',
    -- Estados: EMITIDA, ENVIADA, ANULADA

    fecha_envio TIMESTAMP,
    fecha_anulacion TIMESTAMP,
    motivo_anulacion TEXT,

    CONSTRAINT subtotal_positivo CHECK (subtotal >= 0),
    CONSTRAINT total_positivo CHECK (total >= 0),
    CONSTRAINT estado_factura_valido CHECK (estado IN ('EMITIDA', 'ENVIADA', 'ANULADA'))
);

COMMENT ON TABLE pagos.factura IS 'Facturas electrónicas generadas (SRI)';

CREATE INDEX idx_factura_pago ON pagos.factura(codigo_pago);
CREATE INDEX idx_factura_numero ON pagos.factura(numero_factura);

-- =====================================================
-- TABLA: pagos.reembolso
-- Reembolsos y devoluciones
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos.reembolso (
    codigo_reembolso SERIAL PRIMARY KEY,
    codigo_pago INTEGER NOT NULL REFERENCES pagos.pago(codigo_pago),

    monto_reembolso DECIMAL(10, 2) NOT NULL,
    motivo TEXT NOT NULL,
    metodo_reembolso VARCHAR(50) NOT NULL, -- EFECTIVO, TARJETA, TRANSFERENCIA

    estado VARCHAR(50) NOT NULL DEFAULT 'SOLICITADO',
    -- Estados: SOLICITADO, APROBADO, PROCESANDO, COMPLETADO, RECHAZADO

    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    fecha_procesamiento TIMESTAMP,

    solicitado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),
    aprobado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    CONSTRAINT monto_reembolso_positivo CHECK (monto_reembolso > 0),
    CONSTRAINT estado_reembolso_valido CHECK (estado IN ('SOLICITADO', 'APROBADO', 'PROCESANDO', 'COMPLETADO', 'RECHAZADO'))
);

COMMENT ON TABLE pagos.reembolso IS 'Reembolsos y devoluciones de pagos';

CREATE INDEX idx_reembolso_pago ON pagos.reembolso(codigo_pago);
