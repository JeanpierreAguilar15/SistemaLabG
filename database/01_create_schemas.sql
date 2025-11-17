-- =====================================================
-- CREACIÓN DE ESQUEMAS
-- =====================================================
-- Este script crea todos los esquemas (schemas) del sistema
-- Organización modular por dominios de negocio
-- =====================================================

-- EJECUTAR: psql -U postgres -d laboratorio_franz_db -f 01_create_schemas.sql

\c laboratorio_franz_db

-- =====================================================
-- 1. ESQUEMA: usuarios
-- Gestión de usuarios, roles, autenticación y permisos
-- =====================================================
CREATE SCHEMA IF NOT EXISTS usuarios;
COMMENT ON SCHEMA usuarios IS 'Gestión de usuarios, autenticación, roles y permisos del sistema';

-- =====================================================
-- 2. ESQUEMA: agenda
-- Gestión de citas, turnos, horarios y disponibilidad
-- =====================================================
CREATE SCHEMA IF NOT EXISTS agenda;
COMMENT ON SCHEMA agenda IS 'Gestión de agenda de citas, turnos y disponibilidad de servicios';

-- =====================================================
-- 3. ESQUEMA: catalogo
-- Catálogo de exámenes, servicios y precios
-- =====================================================
CREATE SCHEMA IF NOT EXISTS catalogo;
COMMENT ON SCHEMA catalogo IS 'Catálogo de exámenes, servicios, precios y preparación';

-- =====================================================
-- 4. ESQUEMA: resultados
-- Gestión de resultados de laboratorio
-- =====================================================
CREATE SCHEMA IF NOT EXISTS resultados;
COMMENT ON SCHEMA resultados IS 'Gestión de resultados de exámenes y muestras';

-- =====================================================
-- 5. ESQUEMA: pagos
-- Gestión de pagos, cotizaciones y facturación
-- =====================================================
CREATE SCHEMA IF NOT EXISTS pagos;
COMMENT ON SCHEMA pagos IS 'Gestión de cotizaciones, pagos y facturación';

-- =====================================================
-- 6. ESQUEMA: inventario
-- Gestión de inventario de reactivos e insumos
-- =====================================================
CREATE SCHEMA IF NOT EXISTS inventario;
COMMENT ON SCHEMA inventario IS 'Gestión de inventario de reactivos, insumos y órdenes de compra';

-- =====================================================
-- 7. ESQUEMA: comunicaciones
-- Agente virtual, chat y notificaciones
-- =====================================================
CREATE SCHEMA IF NOT EXISTS comunicaciones;
COMMENT ON SCHEMA comunicaciones IS 'Agente virtual, chat en tiempo real y notificaciones';

-- =====================================================
-- 8. ESQUEMA: auditoria
-- Trazabilidad y auditoría del sistema
-- =====================================================
CREATE SCHEMA IF NOT EXISTS auditoria;
COMMENT ON SCHEMA auditoria IS 'Trazabilidad, auditoría y logs del sistema';

-- Mostrar esquemas creados
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;
