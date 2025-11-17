-- =====================================================
-- ESQUEMA: catalogo
-- Tablas para catálogo de exámenes y precios
-- =====================================================

\c laboratorio_franz_db

-- =====================================================
-- TABLA: catalogo.categoria_examen
-- Categorías de exámenes (Bioquímica, Hematología, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo.categoria_examen (
    codigo_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE catalogo.categoria_examen IS 'Categorías de exámenes (Bioquímica, Hematología, Microbiología, etc.)';

-- =====================================================
-- TABLA: catalogo.examen
-- Exámenes disponibles en el laboratorio
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo.examen (
    codigo_examen SERIAL PRIMARY KEY,
    codigo_categoria INTEGER REFERENCES catalogo.categoria_examen(codigo_categoria),

    -- Información básica
    codigo_interno VARCHAR(50) UNIQUE NOT NULL, -- Código del examen (ej: HCTO-001)
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    nombre_tecnico VARCHAR(200), -- Nombre técnico/científico

    -- Requisitos de preparación
    requiere_ayuno BOOLEAN NOT NULL DEFAULT false,
    horas_ayuno INTEGER,
    requiere_preparacion_especial BOOLEAN NOT NULL DEFAULT false,
    instrucciones_preparacion TEXT,
    contraindicaciones TEXT,

    -- Información del resultado
    tiempo_entrega_horas INTEGER NOT NULL DEFAULT 24,
    tipo_muestra VARCHAR(100), -- Sangre, Orina, Heces, etc.
    volumen_muestra VARCHAR(50),

    -- Valores de referencia por defecto
    valor_referencia_min DECIMAL(10, 4),
    valor_referencia_max DECIMAL(10, 4),
    unidad_medida VARCHAR(50),
    valores_referencia_texto TEXT, -- Para valores cualitativos

    -- Estado
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP
);

COMMENT ON TABLE catalogo.examen IS 'Catálogo de exámenes disponibles en el laboratorio';
COMMENT ON COLUMN catalogo.examen.codigo_interno IS 'Código interno del examen (ej: HCTO-001)';
COMMENT ON COLUMN catalogo.examen.tiempo_entrega_horas IS 'Tiempo estimado de entrega de resultados en horas';

CREATE INDEX idx_examen_codigo_interno ON catalogo.examen(codigo_interno);
CREATE INDEX idx_examen_categoria ON catalogo.examen(codigo_categoria);
CREATE INDEX idx_examen_activo ON catalogo.examen(activo);

-- =====================================================
-- TABLA: catalogo.precio
-- Precios de exámenes (con historial)
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo.precio (
    codigo_precio SERIAL PRIMARY KEY,
    codigo_examen INTEGER NOT NULL REFERENCES catalogo.examen(codigo_examen),

    precio DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Vigencia
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,

    -- Auditoría
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios.usuario(codigo_usuario),

    CONSTRAINT precio_positivo CHECK (precio > 0),
    CONSTRAINT vigencia_valida CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE catalogo.precio IS 'Precios de exámenes con historial de cambios';

CREATE INDEX idx_precio_examen ON catalogo.precio(codigo_examen);
CREATE INDEX idx_precio_vigente ON catalogo.precio(codigo_examen, fecha_inicio, fecha_fin) WHERE activo = true;

-- =====================================================
-- TABLA: catalogo.paquete
-- Paquetes de exámenes con precio especial
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo.paquete (
    codigo_paquete SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_paquete DECIMAL(10, 2) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2),

    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP,

    CONSTRAINT precio_paquete_positivo CHECK (precio_paquete > 0),
    CONSTRAINT descuento_valido CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100)
);

COMMENT ON TABLE catalogo.paquete IS 'Paquetes de exámenes con precios especiales';

-- =====================================================
-- TABLA: catalogo.paquete_examen
-- Exámenes incluidos en cada paquete
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo.paquete_examen (
    codigo_paquete INTEGER NOT NULL REFERENCES catalogo.paquete(codigo_paquete) ON DELETE CASCADE,
    codigo_examen INTEGER NOT NULL REFERENCES catalogo.examen(codigo_examen) ON DELETE CASCADE,
    orden INTEGER, -- Orden de presentación

    PRIMARY KEY (codigo_paquete, codigo_examen)
);

COMMENT ON TABLE catalogo.paquete_examen IS 'Relación entre paquetes y exámenes incluidos';

-- =====================================================
-- DATOS INICIALES: Categorías
-- =====================================================
INSERT INTO catalogo.categoria_examen (nombre, descripcion) VALUES
    ('Hematología', 'Estudio de la sangre y sus componentes'),
    ('Bioquímica', 'Análisis químico de sangre y fluidos corporales'),
    ('Inmunología', 'Estudios del sistema inmune'),
    ('Microbiología', 'Cultivos y análisis microbiológicos'),
    ('Urianálisis', 'Análisis de orina'),
    ('Coprología', 'Análisis de heces'),
    ('Hormonas', 'Perfil hormonal y endocrinológico'),
    ('Marcadores Tumorales', 'Detección de marcadores de cáncer')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Exámenes comunes
-- =====================================================
INSERT INTO catalogo.examen (codigo_categoria, codigo_interno, nombre, descripcion, requiere_ayuno, horas_ayuno, tiempo_entrega_horas, tipo_muestra, unidad_medida, activo)
SELECT
    c.codigo_categoria,
    'HCTO-001',
    'Hemograma Completo',
    'Conteo completo de células sanguíneas',
    false,
    NULL,
    24,
    'Sangre venosa',
    'células/mm³',
    true
FROM catalogo.categoria_examen c
WHERE c.nombre = 'Hematología'
ON CONFLICT (codigo_interno) DO NOTHING;

INSERT INTO catalogo.examen (codigo_categoria, codigo_interno, nombre, descripcion, requiere_ayuno, horas_ayuno, tiempo_entrega_horas, tipo_muestra, unidad_medida, activo)
SELECT
    c.codigo_categoria,
    'BIOQ-001',
    'Glucosa en Ayunas',
    'Medición de glucosa en sangre en ayunas',
    true,
    8,
    4,
    'Sangre venosa',
    'mg/dL',
    true
FROM catalogo.categoria_examen c
WHERE c.nombre = 'Bioquímica'
ON CONFLICT (codigo_interno) DO NOTHING;

INSERT INTO catalogo.examen (codigo_categoria, codigo_interno, nombre, descripcion, requiere_ayuno, horas_ayuno, tiempo_entrega_horas, tipo_muestra, activo)
SELECT
    c.codigo_categoria,
    'URIN-001',
    'Examen General de Orina',
    'Análisis físico, químico y microscópico de orina',
    false,
    NULL,
    12,
    'Orina (primera de la mañana)',
    true
FROM catalogo.categoria_examen c
WHERE c.nombre = 'Urianálisis'
ON CONFLICT (codigo_interno) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: Precios
-- =====================================================
INSERT INTO catalogo.precio (codigo_examen, precio, fecha_inicio, activo)
SELECT codigo_examen, 15.00, CURRENT_DATE, true
FROM catalogo.examen
WHERE codigo_interno = 'HCTO-001'
ON CONFLICT DO NOTHING;

INSERT INTO catalogo.precio (codigo_examen, precio, fecha_inicio, activo)
SELECT codigo_examen, 5.00, CURRENT_DATE, true
FROM catalogo.examen
WHERE codigo_interno = 'BIOQ-001'
ON CONFLICT DO NOTHING;

INSERT INTO catalogo.precio (codigo_examen, precio, fecha_inicio, activo)
SELECT codigo_examen, 8.00, CURRENT_DATE, true
FROM catalogo.examen
WHERE codigo_interno = 'URIN-001'
ON CONFLICT DO NOTHING;
