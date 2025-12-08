-- =====================================================
-- Script SQL de Datos de Prueba - Laboratorio Clínico Franz
-- Autor: Claude
-- Fecha: 2025-12-08
-- Descripción: Datos realistas para pruebas del sistema
-- =====================================================

-- IMPORTANTE: Ejecutar después de las migraciones de Prisma
-- Este script NO borra datos existentes, usar con precaución

-- =====================================================
-- ESQUEMA: usuarios
-- =====================================================

-- Roles del sistema
INSERT INTO usuarios.rol (nombre, descripcion, nivel_acceso, activo) VALUES
('Administrador', 'Acceso total al sistema', 10, true),
('Recepcionista', 'Gestión de citas, pacientes y pagos', 5, true),
('Bioquímico', 'Procesamiento y validación de resultados', 7, true),
('Técnico', 'Toma de muestras y procesamiento básico', 4, true),
('Paciente', 'Acceso a portal de pacientes', 1, true)
ON CONFLICT (nombre) DO NOTHING;

-- Password: "Admin123!" hasheado con bcrypt
-- Nota: En producción, generar estos hashes con la aplicación
-- Usuarios de prueba (password para todos: Test123!)
INSERT INTO usuarios.usuario (
    codigo_rol, cedula, nombres, apellidos, email, telefono,
    fecha_nacimiento, genero, direccion, password_hash, salt,
    email_verificado, activo
) VALUES
-- Administradores
(1, '1234567890', 'Carlos', 'Mendoza', 'admin@labfranz.com', '70012345',
 '1985-03-15', 'Masculino', 'Av. Heroínas 123, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt123', true, true),

(1, '1234567891', 'María', 'López García', 'maria.lopez@labfranz.com', '70012346',
 '1988-07-22', 'Femenino', 'Calle Jordán 456, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt124', true, true),

-- Recepcionistas
(2, '2234567890', 'Ana', 'Rojas Vargas', 'recepcion1@labfranz.com', '70023456',
 '1992-01-10', 'Femenino', 'Av. América 789, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt125', true, true),

(2, '2234567891', 'Roberto', 'Fernández', 'recepcion2@labfranz.com', '70023457',
 '1990-05-20', 'Masculino', 'Calle España 321, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt126', true, true),

-- Bioquímicos
(3, '3234567890', 'Dr. Fernando', 'Salazar Mendoza', 'bioquimico1@labfranz.com', '70034567',
 '1975-11-30', 'Masculino', 'Av. Ballivián 555, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt127', true, true),

(3, '3234567891', 'Dra. Lucía', 'Vega Torres', 'bioquimico2@labfranz.com', '70034568',
 '1980-04-18', 'Femenino', 'Calle Antezana 222, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt128', true, true),

-- Técnicos
(4, '4234567890', 'Pedro', 'Quispe Mamani', 'tecnico1@labfranz.com', '70045678',
 '1995-08-05', 'Masculino', 'Zona Villa Busch, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt129', true, true),

-- Pacientes
(5, '5234567890', 'Juan', 'Pérez Condori', 'juan.perez@gmail.com', '70056789',
 '1988-02-14', 'Masculino', 'Av. Blanco Galindo Km 5, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt130', true, true),

(5, '5234567891', 'Laura', 'Gutiérrez Soliz', 'laura.gutierrez@gmail.com', '70056790',
 '1992-06-25', 'Femenino', 'Calle Lanza 123, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt131', true, true),

(5, '5234567892', 'Sofía', 'Mamani Flores', 'sofia.mamani@gmail.com', '70056791',
 '1985-09-12', 'Femenino', 'Av. Ayacucho 456, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt132', true, true),

(5, '5234567893', 'Miguel', 'Torrico Vargas', 'miguel.torrico@gmail.com', '70056792',
 '1978-12-03', 'Masculino', 'Zona Sarco, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt133', true, true),

(5, '5234567894', 'Carmen', 'Delgado Ríos', 'carmen.delgado@gmail.com', '70056793',
 '1995-03-28', 'Femenino', 'Av. Beijing 789, Cochabamba',
 '$2b$10$rIC0qS.OCWz5fNqQK/jYH.vP6/v1JaXcg5Ry5YnLI.vN6Zz0Cq5gy',
 'randomsalt134', true, true)
ON CONFLICT (cedula) DO NOTHING;

-- Configuración del Sistema
INSERT INTO usuarios.configuracion_sistema (clave, valor, descripcion, grupo, tipo_dato, es_publico) VALUES
('NOMBRE_LABORATORIO', 'Laboratorio Clínico Franz', 'Nombre comercial del laboratorio', 'GENERAL', 'STRING', true),
('TELEFONO_PRINCIPAL', '(+591) 4-4556677', 'Teléfono principal de atención', 'CONTACTO', 'STRING', true),
('WHATSAPP', '+591 70012345', 'Número de WhatsApp para contacto', 'CONTACTO', 'STRING', true),
('EMAIL_CONTACTO', 'contacto@labfranz.com', 'Email principal de contacto', 'CONTACTO', 'STRING', true),
('DIRECCION', 'Av. Heroínas #123, Cochabamba, Bolivia', 'Dirección física del laboratorio', 'CONTACTO', 'STRING', true),
('HORARIO_ATENCION', 'Lunes a Viernes: 7:00 - 19:00, Sábados: 7:00 - 13:00', 'Horario de atención', 'GENERAL', 'STRING', true),
('HORA_INICIO_CITAS', '07:00', 'Hora de inicio para agendar citas', 'AGENDA', 'TIME', false),
('HORA_FIN_CITAS', '18:00', 'Hora de fin para agendar citas', 'AGENDA', 'TIME', false),
('DURACION_SLOT_MINUTOS', '15', 'Duración de cada slot de citas en minutos', 'AGENDA', 'INTEGER', false),
('DIAS_ANTICIPACION_CITAS', '30', 'Días máximos de anticipación para agendar', 'AGENDA', 'INTEGER', false),
-- Configuración de Seguridad
('LOGIN_MAX_INTENTOS', '5', 'Número máximo de intentos de login antes de bloquear', 'SEGURIDAD', 'INTEGER', false),
('LOGIN_MINUTOS_BLOQUEO', '5', 'Minutos de bloqueo después de exceder intentos', 'SEGURIDAD', 'INTEGER', false),
('SESSION_TIMEOUT_MINUTOS', '30', 'Minutos de inactividad antes de cerrar sesión', 'SEGURIDAD', 'INTEGER', false),
('PASSWORD_MIN_LENGTH', '8', 'Longitud mínima de contraseña', 'SEGURIDAD', 'INTEGER', false),
('REQUIRE_EMAIL_VERIFICATION', 'false', 'Requiere verificación de email para login', 'SEGURIDAD', 'BOOLEAN', false)
ON CONFLICT (clave) DO NOTHING;

-- =====================================================
-- ESQUEMA: agenda
-- =====================================================

-- Servicios
INSERT INTO agenda.servicio (nombre, descripcion, activo) VALUES
('Análisis Clínicos', 'Exámenes de laboratorio generales y especializados', true),
('Toma de Muestras', 'Servicio de extracción de sangre y otros fluidos', true),
('Recepción de Muestras', 'Recepción de muestras externas para análisis', true)
ON CONFLICT DO NOTHING;

-- Sedes
INSERT INTO agenda.sede (nombre, direccion, telefono, email, activo) VALUES
('Sede Central', 'Av. Heroínas #123, Cochabamba', '4-4556677', 'central@labfranz.com', true),
('Sede Norte', 'Av. Blanco Galindo Km 3, Cochabamba', '4-4556688', 'norte@labfranz.com', true)
ON CONFLICT DO NOTHING;

-- Feriados 2025
INSERT INTO agenda.feriado (fecha, descripcion, activo) VALUES
('2025-01-01', 'Año Nuevo', true),
('2025-01-22', 'Día del Estado Plurinacional', true),
('2025-03-03', 'Carnaval - Lunes', true),
('2025-03-04', 'Carnaval - Martes', true),
('2025-04-18', 'Viernes Santo', true),
('2025-05-01', 'Día del Trabajo', true),
('2025-06-19', 'Corpus Christi', true),
('2025-06-21', 'Año Nuevo Aymara', true),
('2025-08-06', 'Día de la Independencia', true),
('2025-09-14', 'Día de Cochabamba', true),
('2025-11-02', 'Día de los Difuntos', true),
('2025-12-25', 'Navidad', true)
ON CONFLICT (fecha) DO NOTHING;

-- =====================================================
-- ESQUEMA: catalogo
-- =====================================================

-- Categorías de Exámenes
INSERT INTO catalogo.categoria_examen (nombre, descripcion, activo) VALUES
('Hematología', 'Análisis de sangre y sus componentes', true),
('Bioquímica', 'Análisis químicos en sangre y otros fluidos', true),
('Uroanálisis', 'Análisis de orina', true),
('Hormonas', 'Análisis hormonales', true),
('Inmunología', 'Estudios del sistema inmune', true),
('Microbiología', 'Cultivos y análisis microbiológicos', true),
('Coprología', 'Análisis de heces', true),
('Marcadores Tumorales', 'Detección de marcadores de cáncer', true),
('Perfil Lipídico', 'Análisis de grasas en sangre', true),
('Coagulación', 'Estudios de la coagulación sanguínea', true)
ON CONFLICT (nombre) DO NOTHING;

-- Exámenes
INSERT INTO catalogo.examen (
    codigo_categoria, codigo_interno, nombre, descripcion,
    requiere_ayuno, horas_ayuno, instrucciones_preparacion,
    tiempo_entrega_horas, tipo_muestra,
    valor_referencia_min, valor_referencia_max, valores_referencia_texto, unidad_medida, activo
) VALUES
-- Hematología (categoria 1)
(1, 'HEM-001', 'Hemograma Completo', 'Análisis completo de células sanguíneas',
 false, null, 'No requiere preparación especial', 4, 'Sangre venosa',
 null, null, 'Ver informe detallado', null, true),

(1, 'HEM-002', 'Grupo Sanguíneo y Factor Rh', 'Determinación de tipo de sangre',
 false, null, 'No requiere preparación especial', 2, 'Sangre venosa',
 null, null, 'A, B, AB u O / Rh+ o Rh-', null, true),

(1, 'HEM-003', 'Velocidad de Sedimentación (VSG)', 'Velocidad de eritrosedimentación',
 false, null, 'No requiere preparación especial', 2, 'Sangre venosa',
 0, 20, 'Hombres: 0-15 mm/h, Mujeres: 0-20 mm/h', 'mm/h', true),

-- Bioquímica (categoria 2)
(2, 'BIO-001', 'Glucosa en Ayunas', 'Medición de azúcar en sangre',
 true, 8, 'Ayuno mínimo de 8 horas. No consumir alimentos ni bebidas azucaradas.',
 2, 'Sangre venosa', 70, 100, '70-100 mg/dL (Valores normales)', 'mg/dL', true),

(2, 'BIO-002', 'Creatinina', 'Evaluación de función renal',
 false, null, 'No requiere preparación especial', 2, 'Sangre venosa',
 0.7, 1.3, '0.7-1.3 mg/dL', 'mg/dL', true),

(2, 'BIO-003', 'Urea', 'Evaluación de función renal',
 false, null, 'Evitar exceso de proteínas 24h antes', 2, 'Sangre venosa',
 15, 45, '15-45 mg/dL', 'mg/dL', true),

(2, 'BIO-004', 'Ácido Úrico', 'Detección de gota y problemas metabólicos',
 true, 8, 'Ayuno de 8 horas', 2, 'Sangre venosa',
 2.5, 7.0, 'H: 3.5-7.0 mg/dL, M: 2.5-6.0 mg/dL', 'mg/dL', true),

(2, 'BIO-005', 'Perfil Hepático Completo', 'Evaluación de función del hígado (TGO, TGP, FA, GGT, Bilirrubinas)',
 true, 12, 'Ayuno de 12 horas', 4, 'Sangre venosa',
 null, null, 'Ver valores individuales en informe', null, true),

-- Uroanálisis (categoria 3)
(3, 'URO-001', 'Examen General de Orina', 'Análisis físico-químico y sedimento',
 false, null, 'Recoger primera orina de la mañana', 2, 'Orina',
 null, null, 'Ver informe detallado', null, true),

(3, 'URO-002', 'Urocultivo', 'Cultivo de orina para detectar infecciones',
 false, null, 'Aseo genital previo, orina de la mitad de la micción', 48, 'Orina',
 null, null, 'Negativo: Sin desarrollo bacteriano', null, true),

-- Hormonas (categoria 4)
(4, 'HOR-001', 'TSH (Hormona Estimulante de Tiroides)', 'Evaluación tiroidea',
 false, null, 'No requiere preparación especial', 24, 'Sangre venosa',
 0.4, 4.0, '0.4-4.0 mUI/L', 'mUI/L', true),

(4, 'HOR-002', 'T4 Libre', 'Tiroxina libre',
 false, null, 'No requiere preparación especial', 24, 'Sangre venosa',
 0.8, 1.8, '0.8-1.8 ng/dL', 'ng/dL', true),

(4, 'HOR-003', 'T3 Total', 'Triyodotironina',
 false, null, 'No requiere preparación especial', 24, 'Sangre venosa',
 80, 200, '80-200 ng/dL', 'ng/dL', true),

-- Perfil Lipídico (categoria 9)
(9, 'LIP-001', 'Colesterol Total', 'Nivel de colesterol en sangre',
 true, 12, 'Ayuno de 12 horas', 2, 'Sangre venosa',
 null, 200, 'Deseable: <200 mg/dL', 'mg/dL', true),

(9, 'LIP-002', 'Colesterol HDL', 'Colesterol bueno',
 true, 12, 'Ayuno de 12 horas', 2, 'Sangre venosa',
 40, null, 'Deseable: >40 mg/dL', 'mg/dL', true),

(9, 'LIP-003', 'Colesterol LDL', 'Colesterol malo',
 true, 12, 'Ayuno de 12 horas', 2, 'Sangre venosa',
 null, 130, 'Óptimo: <100 mg/dL', 'mg/dL', true),

(9, 'LIP-004', 'Triglicéridos', 'Nivel de triglicéridos',
 true, 12, 'Ayuno de 12 horas, evitar alcohol 24h antes', 2, 'Sangre venosa',
 null, 150, 'Normal: <150 mg/dL', 'mg/dL', true),

-- Inmunología (categoria 5)
(5, 'INM-001', 'PCR (Proteína C Reactiva)', 'Marcador de inflamación',
 false, null, 'No requiere preparación especial', 4, 'Sangre venosa',
 0, 6, '<6 mg/L', 'mg/L', true),

(5, 'INM-002', 'Factor Reumatoideo', 'Detección de artritis reumatoide',
 false, null, 'No requiere preparación especial', 24, 'Sangre venosa',
 null, 14, 'Negativo: <14 UI/mL', 'UI/mL', true),

-- Coagulación (categoria 10)
(10, 'COA-001', 'Tiempo de Protrombina (TP)', 'Evaluación de coagulación',
 false, null, 'No requiere preparación especial', 2, 'Sangre venosa',
 11, 13.5, '11-13.5 segundos', 'segundos', true),

(10, 'COA-002', 'Tiempo de Tromboplastina Parcial (TTP)', 'Evaluación de coagulación',
 false, null, 'No requiere preparación especial', 2, 'Sangre venosa',
 25, 35, '25-35 segundos', 'segundos', true)
ON CONFLICT (codigo_interno) DO NOTHING;

-- Precios de Exámenes (actuales)
INSERT INTO catalogo.precio (codigo_examen, precio, fecha_inicio, activo)
SELECT codigo_examen,
    CASE
        WHEN codigo_interno LIKE 'HEM%' THEN 45.00
        WHEN codigo_interno = 'BIO-001' THEN 25.00
        WHEN codigo_interno IN ('BIO-002', 'BIO-003', 'BIO-004') THEN 35.00
        WHEN codigo_interno = 'BIO-005' THEN 120.00
        WHEN codigo_interno = 'URO-001' THEN 30.00
        WHEN codigo_interno = 'URO-002' THEN 80.00
        WHEN codigo_interno LIKE 'HOR%' THEN 85.00
        WHEN codigo_interno LIKE 'LIP%' THEN 35.00
        WHEN codigo_interno LIKE 'INM%' THEN 55.00
        WHEN codigo_interno LIKE 'COA%' THEN 40.00
        ELSE 50.00
    END,
    '2025-01-01',
    true
FROM catalogo.examen
WHERE NOT EXISTS (
    SELECT 1 FROM catalogo.precio p
    WHERE p.codigo_examen = examen.codigo_examen AND p.activo = true
);

-- Paquetes de Exámenes
INSERT INTO catalogo.paquete (nombre, descripcion, precio_paquete, descuento, activo) VALUES
('Chequeo Básico', 'Hemograma + Glucosa + EGO', 80.00, 20.00, true),
('Perfil Lipídico Completo', 'Colesterol Total, HDL, LDL, Triglicéridos', 120.00, 20.00, true),
('Perfil Tiroideo', 'TSH + T4L + T3', 220.00, 35.00, true),
('Chequeo Ejecutivo', 'Hemograma + Glucosa + Perfil Lipídico + Creatinina + EGO', 200.00, 50.00, true),
('Perfil Renal', 'Creatinina + Urea + Ácido Úrico + EGO', 100.00, 25.00, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ESQUEMA: inventario
-- =====================================================

-- Categorías de Items
INSERT INTO inventario.categoria_item (nombre, descripcion, activo) VALUES
('Reactivos', 'Reactivos químicos para análisis', true),
('Consumibles', 'Materiales descartables', true),
('Tubos de Muestra', 'Tubos para recolección de muestras', true),
('Equipos de Protección', 'EPP y material de bioseguridad', true),
('Material de Laboratorio', 'Material general de laboratorio', true)
ON CONFLICT (nombre) DO NOTHING;

-- Items de Inventario
INSERT INTO inventario.item (
    codigo_categoria, codigo_interno, nombre, descripcion,
    unidad_medida, stock_actual, stock_minimo, stock_maximo, costo_unitario, activo
) VALUES
-- Tubos de Muestra (categoria 3)
(3, 'TUB-001', 'Tubo Vacutainer Tapa Roja', 'Tubo sin anticoagulante 5ml',
 'unidad', 500, 100, 1000, 1.50, true),
(3, 'TUB-002', 'Tubo Vacutainer Tapa Lila (EDTA)', 'Tubo con EDTA 3ml',
 'unidad', 450, 100, 1000, 2.00, true),
(3, 'TUB-003', 'Tubo Vacutainer Tapa Azul (Citrato)', 'Tubo citratado 3.2%',
 'unidad', 200, 50, 500, 2.50, true),
(3, 'TUB-004', 'Tubo Vacutainer Tapa Verde (Heparina)', 'Tubo heparinizado',
 'unidad', 150, 50, 500, 2.20, true),

-- Consumibles (categoria 2)
(2, 'CON-001', 'Aguja Vacutainer 21G', 'Agujas para extracción 21 gauge',
 'unidad', 1000, 200, 2000, 0.80, true),
(2, 'CON-002', 'Jeringa 5ml', 'Jeringa descartable 5ml',
 'unidad', 800, 200, 1500, 0.40, true),
(2, 'CON-003', 'Algodón en Torundas', 'Algodón estéril en bolitas',
 'paquete', 50, 10, 100, 5.00, true),
(2, 'CON-004', 'Alcohol 70%', 'Alcohol etílico para desinfección',
 'litro', 20, 5, 50, 15.00, true),
(2, 'CON-005', 'Curitas Adhesivas', 'Banditas adhesivas circulares',
 'caja', 30, 10, 50, 8.00, true),

-- Reactivos (categoria 1)
(1, 'REA-001', 'Reactivo Glucosa GOD-PAP', 'Kit para determinación de glucosa',
 'kit', 15, 3, 30, 250.00, true),
(1, 'REA-002', 'Reactivo Creatinina Jaffe', 'Kit para determinación de creatinina',
 'kit', 12, 3, 25, 180.00, true),
(1, 'REA-003', 'Reactivo Colesterol CHOD-PAP', 'Kit para colesterol total',
 'kit', 10, 3, 25, 220.00, true),
(1, 'REA-004', 'Reactivo Triglicéridos GPO-PAP', 'Kit para triglicéridos',
 'kit', 8, 3, 20, 200.00, true),
(1, 'REA-005', 'Tiras Reactivas de Orina', 'Tiras para uroanálisis 10 parámetros',
 'frasco', 25, 5, 50, 85.00, true),

-- EPP (categoria 4)
(4, 'EPP-001', 'Guantes de Nitrilo M', 'Guantes descartables nitrilo talla M',
 'caja', 40, 10, 80, 45.00, true),
(4, 'EPP-002', 'Guantes de Nitrilo L', 'Guantes descartables nitrilo talla L',
 'caja', 35, 10, 80, 45.00, true),
(4, 'EPP-003', 'Mascarilla N95', 'Respirador N95',
 'unidad', 100, 20, 200, 8.00, true),
(4, 'EPP-004', 'Bata Descartable', 'Bata de protección descartable',
 'unidad', 50, 20, 100, 12.00, true)
ON CONFLICT (codigo_interno) DO NOTHING;

-- Proveedores
INSERT INTO inventario.proveedor (ruc, razon_social, nombre_comercial, telefono, email, direccion, activo) VALUES
('1234567890001', 'LABORATORIOS BAGÓ S.A.', 'Bagó Bolivia', '2-2443355', 'ventas@bago.com.bo', 'Av. Arce 2345, La Paz', true),
('2345678901001', 'DROGUERÍA INTI S.R.L.', 'Droguería Inti', '4-4225566', 'pedidos@inti.com.bo', 'Av. Blanco Galindo Km 2, Cochabamba', true),
('3456789012001', 'MEDICAL SUPPLIES BOLIVIA', 'MedSupply', '2-2789900', 'info@medsupply.com.bo', 'Zona Sur Calle 21, La Paz', true),
('4567890123001', 'BIOQUÍMICA UNIVERSAL', 'BioUniversal', '4-4667788', 'comercial@biouniversal.com.bo', 'Calle Jordán 890, Cochabamba', true)
ON CONFLICT (ruc) DO NOTHING;

-- Lotes de Items (ejemplos con vencimientos variados)
INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_fabricacion, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor, fecha_ingreso
)
SELECT
    i.codigo_item,
    'LOT-2025-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + (RANDOM() * 365 + 30)::INTEGER * INTERVAL '1 day',
    i.stock_actual,
    i.stock_actual,
    'Proveedor Inicial',
    CURRENT_DATE - INTERVAL '30 days'
FROM inventario.item i
WHERE i.codigo_interno LIKE 'REA%' OR i.codigo_interno LIKE 'TUB%';

-- =====================================================
-- DATOS DE SEGURIDAD Y AUDITORÍA (para pruebas)
-- =====================================================

-- Logs de intentos de login (algunos exitosos, algunos fallidos)
INSERT INTO auditoria.log_intento_login (identificador, ip_address, user_agent, exitoso, motivo_fallo, codigo_usuario, fecha_intento) VALUES
('admin@labfranz.com', '192.168.1.100', 'Mozilla/5.0 Windows Chrome', true, null, 1, NOW() - INTERVAL '2 hours'),
('admin@labfranz.com', '192.168.1.100', 'Mozilla/5.0 Windows Chrome', true, null, 1, NOW() - INTERVAL '1 day'),
('juan.perez@gmail.com', '181.115.20.45', 'Mozilla/5.0 Android', true, null, 8, NOW() - INTERVAL '30 minutes'),
('usuario_fake@test.com', '45.67.89.100', 'curl/7.64.1', false, 'USUARIO_NO_EXISTE', null, NOW() - INTERVAL '3 hours'),
('admin@labfranz.com', '45.67.89.100', 'curl/7.64.1', false, 'CREDENCIALES_INVALIDAS', 1, NOW() - INTERVAL '3 hours'),
('admin@labfranz.com', '45.67.89.100', 'curl/7.64.1', false, 'CREDENCIALES_INVALIDAS', 1, NOW() - INTERVAL '2 hours 55 minutes'),
('admin@labfranz.com', '45.67.89.100', 'curl/7.64.1', false, 'CREDENCIALES_INVALIDAS', 1, NOW() - INTERVAL '2 hours 50 minutes');

-- Alertas de seguridad de ejemplo
INSERT INTO auditoria.alerta_seguridad (tipo_alerta, nivel, descripcion, ip_address, codigo_usuario, datos_adicionales, resuelta, fecha_alerta) VALUES
('FUERZA_BRUTA', 'WARNING', 'Posible ataque de fuerza bruta: 3 intentos fallidos desde IP 45.67.89.100 en los últimos 15 minutos.', '45.67.89.100', null, '{"intentos_fallidos": 3, "ultimo_identificador": "admin@labfranz.com"}', false, NOW() - INTERVAL '2 hours 45 minutes');

-- Logs de actividad de ejemplo
INSERT INTO auditoria.log_actividad (codigo_usuario, accion, entidad, descripcion, ip_address, user_agent, fecha_accion) VALUES
(1, 'POST /auth/login', 'auth', '{"body": {"email": "admin@labfranz.com"}}', '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '2 hours'),
(1, 'GET /admin/inventory/items', 'inventory', '{}', '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '1 hour 50 minutes'),
(1, 'POST /admin/inventory/items', 'inventory', '{"body": {"nombre": "Nuevo Item"}}', '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '1 hour 45 minutes'),
(3, 'PUT /admin/examenes/1', 'examenes', '{"body": {"precio": 50}}', '192.168.1.101', 'Mozilla/5.0', NOW() - INTERVAL '1 hour');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script de datos de prueba ejecutado exitosamente.';
    RAISE NOTICE 'Usuarios creados: admin@labfranz.com, juan.perez@gmail.com, etc.';
    RAISE NOTICE 'Password por defecto: Test123!';
END $$;
