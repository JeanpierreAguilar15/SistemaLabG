-- Configuración de facturación para el administrador
CREATE TABLE facturacion.configuracion (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Insertar valores por defecto
INSERT INTO facturacion.configuracion (key, value, descripcion) VALUES 
('iva_percentage', '12', 'Porcentaje de IVA aplicable'),
('default_tax_rate', '0', 'Tasa de impuesto por defecto');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION facturacion.update_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_configuracion_updated_at
    BEFORE UPDATE ON facturacion.configuracion
    FOR EACH ROW
    EXECUTE FUNCTION facturacion.update_config_updated_at();