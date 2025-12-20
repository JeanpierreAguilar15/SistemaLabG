-- Agregar campos de reactivo al Item
ALTER TABLE inventario.item 
ADD COLUMN IF NOT EXISTS es_reactivo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vida_util_dias_abierto INTEGER,
ADD COLUMN IF NOT EXISTS capacidad_pruebas INTEGER;

-- Agregar campos de apertura al Lote
ALTER TABLE inventario.lote 
ADD COLUMN IF NOT EXISTS estado_lote VARCHAR(20) DEFAULT 'CERRADO',
ADD COLUMN IF NOT EXISTS fecha_apertura TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_vencimiento_abierto TIMESTAMP,
ADD COLUMN IF NOT EXISTS pruebas_realizadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS motivo_descarte VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_descarte TIMESTAMP;

-- Comentarios para documentacion
COMMENT ON COLUMN inventario.item.es_reactivo IS 'Indica si es un reactivo que se abre y tiene vida util limitada';
COMMENT ON COLUMN inventario.item.vida_util_dias_abierto IS 'Dias de vida util despues de abierto';
COMMENT ON COLUMN inventario.item.capacidad_pruebas IS 'Numero de pruebas que puede realizar por unidad';
COMMENT ON COLUMN inventario.lote.estado_lote IS 'Estado: CERRADO, ABIERTO, AGOTADO, DESCARTADO';
COMMENT ON COLUMN inventario.lote.fecha_apertura IS 'Fecha y hora cuando se abrio el lote';
COMMENT ON COLUMN inventario.lote.fecha_vencimiento_abierto IS 'Fecha vencimiento calculada tras apertura';
COMMENT ON COLUMN inventario.lote.pruebas_realizadas IS 'Contador de pruebas realizadas con este lote';
COMMENT ON COLUMN inventario.lote.motivo_descarte IS 'Razon del descarte: VENCIDO_APERTURA, VENCIDO_LOTE, AGOTADO, MANUAL';
