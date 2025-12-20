-- ======================================================
-- DATOS DE PRUEBA PARA CONTROL DE REACTIVOS
-- Ejecutar despues de la migracion de campos de reactivos
-- ======================================================

-- Primero asegurarnos que los campos existen
-- Si da error, ejecutar primero: prisma/migrations/20251220_add_reactivo_apertura_fields/migration.sql

-- ======================================================
-- 1. CREAR CATEGORIA DE REACTIVOS SI NO EXISTE
-- ======================================================
INSERT INTO inventario.categoria_item (nombre, descripcion)
SELECT 'Reactivos', 'Reactivos de laboratorio con vida util limitada despues de abiertos'
WHERE NOT EXISTS (
    SELECT 1 FROM inventario.categoria_item WHERE nombre = 'Reactivos'
);

-- ======================================================
-- 2. CREAR ITEMS DE REACTIVOS DE PRUEBA
-- ======================================================

-- Reactivo de Glucosa
INSERT INTO inventario.item (
    codigo_interno, nombre, descripcion, unidad_medida,
    stock_actual, stock_minimo, costo_unitario,
    es_reactivo, vida_util_dias_abierto, capacidad_pruebas,
    codigo_categoria, activo
)
SELECT
    'REACT-GLU-001',
    'Reactivo Glucosa Liquida',
    'Reactivo para determinacion de glucosa en suero/plasma. Kit de 100 pruebas.',
    'Kit',
    5,  -- 5 kits en stock
    2,  -- minimo 2
    45.00,
    true,  -- ES REACTIVO
    3,     -- 3 dias de vida util despues de abierto
    100,   -- capacidad de 100 pruebas por kit
    (SELECT codigo_categoria FROM inventario.categoria_item WHERE nombre = 'Reactivos' LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM inventario.item WHERE codigo_interno = 'REACT-GLU-001'
);

-- Reactivo de Colesterol
INSERT INTO inventario.item (
    codigo_interno, nombre, descripcion, unidad_medida,
    stock_actual, stock_minimo, costo_unitario,
    es_reactivo, vida_util_dias_abierto, capacidad_pruebas,
    codigo_categoria, activo
)
SELECT
    'REACT-COL-001',
    'Reactivo Colesterol Total',
    'Reactivo enzimatico para determinacion de colesterol total. Kit de 50 pruebas.',
    'Kit',
    3,  -- 3 kits en stock
    2,  -- minimo 2
    55.00,
    true,  -- ES REACTIVO
    2,     -- 2 dias de vida util despues de abierto
    50,    -- capacidad de 50 pruebas por kit
    (SELECT codigo_categoria FROM inventario.categoria_item WHERE nombre = 'Reactivos' LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM inventario.item WHERE codigo_interno = 'REACT-COL-001'
);

-- Reactivo de Trigliceridos
INSERT INTO inventario.item (
    codigo_interno, nombre, descripcion, unidad_medida,
    stock_actual, stock_minimo, costo_unitario,
    es_reactivo, vida_util_dias_abierto, capacidad_pruebas,
    codigo_categoria, activo
)
SELECT
    'REACT-TRI-001',
    'Reactivo Trigliceridos',
    'Reactivo para determinacion de trigliceridos. Kit de 80 pruebas.',
    'Kit',
    4,  -- 4 kits en stock
    2,  -- minimo 2
    50.00,
    true,  -- ES REACTIVO
    3,     -- 3 dias de vida util despues de abierto
    80,    -- capacidad de 80 pruebas por kit
    (SELECT codigo_categoria FROM inventario.categoria_item WHERE nombre = 'Reactivos' LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM inventario.item WHERE codigo_interno = 'REACT-TRI-001'
);

-- Reactivo de Hemoglobina Glicosilada
INSERT INTO inventario.item (
    codigo_interno, nombre, descripcion, unidad_medida,
    stock_actual, stock_minimo, costo_unitario,
    es_reactivo, vida_util_dias_abierto, capacidad_pruebas,
    codigo_categoria, activo
)
SELECT
    'REACT-HBA1C-001',
    'Reactivo HbA1c',
    'Reactivo para hemoglobina glicosilada. Kit de 25 pruebas.',
    'Kit',
    2,  -- 2 kits en stock
    1,  -- minimo 1
    120.00,
    true,  -- ES REACTIVO
    7,     -- 7 dias de vida util despues de abierto
    25,    -- capacidad de 25 pruebas por kit
    (SELECT codigo_categoria FROM inventario.categoria_item WHERE nombre = 'Reactivos' LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM inventario.item WHERE codigo_interno = 'REACT-HBA1C-001'
);

-- Reactivo de Creatinina
INSERT INTO inventario.item (
    codigo_interno, nombre, descripcion, unidad_medida,
    stock_actual, stock_minimo, costo_unitario,
    es_reactivo, vida_util_dias_abierto, capacidad_pruebas,
    codigo_categoria, activo
)
SELECT
    'REACT-CREA-001',
    'Reactivo Creatinina Jaffe',
    'Reactivo para creatinina metodo Jaffe. Kit de 100 pruebas.',
    'Kit',
    3,  -- 3 kits en stock
    2,  -- minimo 2
    40.00,
    true,  -- ES REACTIVO
    5,     -- 5 dias de vida util despues de abierto
    100,   -- capacidad de 100 pruebas por kit
    (SELECT codigo_categoria FROM inventario.categoria_item WHERE nombre = 'Reactivos' LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM inventario.item WHERE codigo_interno = 'REACT-CREA-001'
);

-- ======================================================
-- 3. CREAR LOTES PARA LOS REACTIVOS
-- ======================================================

-- Lotes para Glucosa
INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor,
    estado_lote, pruebas_realizadas
)
SELECT
    codigo_item,
    'GLU-2025-001',
    '2025-06-30'::date,
    1, 1, 'Wiener Lab',
    'CERRADO', 0
FROM inventario.item WHERE codigo_interno = 'REACT-GLU-001'
AND NOT EXISTS (
    SELECT 1 FROM inventario.lote WHERE numero_lote = 'GLU-2025-001'
);

INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor,
    estado_lote, pruebas_realizadas
)
SELECT
    codigo_item,
    'GLU-2025-002',
    '2025-08-15'::date,
    1, 1, 'Wiener Lab',
    'CERRADO', 0
FROM inventario.item WHERE codigo_interno = 'REACT-GLU-001'
AND NOT EXISTS (
    SELECT 1 FROM inventario.lote WHERE numero_lote = 'GLU-2025-002'
);

-- Lotes para Colesterol
INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor,
    estado_lote, pruebas_realizadas
)
SELECT
    codigo_item,
    'COL-2025-001',
    '2025-05-20'::date,
    1, 1, 'Roche Diagnostics',
    'CERRADO', 0
FROM inventario.item WHERE codigo_interno = 'REACT-COL-001'
AND NOT EXISTS (
    SELECT 1 FROM inventario.lote WHERE numero_lote = 'COL-2025-001'
);

-- Lotes para Trigliceridos
INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor,
    estado_lote, pruebas_realizadas
)
SELECT
    codigo_item,
    'TRI-2025-001',
    '2025-07-10'::date,
    1, 1, 'Human Diagnostics',
    'CERRADO', 0
FROM inventario.item WHERE codigo_interno = 'REACT-TRI-001'
AND NOT EXISTS (
    SELECT 1 FROM inventario.lote WHERE numero_lote = 'TRI-2025-001'
);

-- Lotes para HbA1c
INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor,
    estado_lote, pruebas_realizadas
)
SELECT
    codigo_item,
    'HBA1C-2025-001',
    '2025-09-30'::date,
    1, 1, 'Bio-Rad',
    'CERRADO', 0
FROM inventario.item WHERE codigo_interno = 'REACT-HBA1C-001'
AND NOT EXISTS (
    SELECT 1 FROM inventario.lote WHERE numero_lote = 'HBA1C-2025-001'
);

-- Lotes para Creatinina
INSERT INTO inventario.lote (
    codigo_item, numero_lote, fecha_vencimiento,
    cantidad_inicial, cantidad_actual, proveedor,
    estado_lote, pruebas_realizadas
)
SELECT
    codigo_item,
    'CREA-2025-001',
    '2025-04-15'::date,
    1, 1, 'Wiener Lab',
    'CERRADO', 0
FROM inventario.item WHERE codigo_interno = 'REACT-CREA-001'
AND NOT EXISTS (
    SELECT 1 FROM inventario.lote WHERE numero_lote = 'CREA-2025-001'
);

-- ======================================================
-- 4. VERIFICAR DATOS CREADOS
-- ======================================================

-- Ver items de reactivos creados
SELECT
    codigo_item,
    codigo_interno,
    nombre,
    es_reactivo,
    vida_util_dias_abierto as vida_dias,
    capacidad_pruebas
FROM inventario.item
WHERE es_reactivo = true
ORDER BY nombre;

-- Ver lotes de reactivos creados
SELECT
    l.codigo_lote,
    l.numero_lote,
    i.nombre as item,
    l.estado_lote,
    l.fecha_vencimiento,
    l.pruebas_realizadas,
    i.capacidad_pruebas
FROM inventario.lote l
JOIN inventario.item i ON l.codigo_item = i.codigo_item
WHERE i.es_reactivo = true
ORDER BY l.codigo_lote;

-- ======================================================
-- INSTRUCCIONES DE USO:
-- ======================================================
-- 1. Ejecutar este script en la base de datos
-- 2. Usar los endpoints de la API para:
--    - GET  /api/v1/admin/inventory/reactivos/lotes-abiertos
--    - POST /api/v1/admin/inventory/reactivos/abrir-lote
--      Body: { "codigo_lote": 1 }
--    - POST /api/v1/admin/inventory/reactivos/registrar-pruebas
--      Body: { "codigo_lote": 1, "cantidad_pruebas": 10 }
--    - POST /api/v1/admin/inventory/reactivos/descartar-lote
--      Body: { "codigo_lote": 1, "motivo": "VENCIDO_APERTURA" }
-- ======================================================
