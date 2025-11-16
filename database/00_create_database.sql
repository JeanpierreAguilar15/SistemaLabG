-- =====================================================
-- SISTEMA DE LABORATORIO CLÍNICO FRANZ
-- Base de Datos PostgreSQL
-- =====================================================
-- Nombre de la base de datos: laboratorio_franz_db
-- Versión: 1.0.0
-- Fecha: 2025-11-16
-- =====================================================

-- Crear la base de datos
-- EJECUTAR ESTE SCRIPT COMO USUARIO postgres:
-- psql -U postgres -f 00_create_database.sql

-- Crear la base de datos
CREATE DATABASE laboratorio_franz_db
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'es_EC.UTF-8'
    LC_CTYPE = 'es_EC.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE laboratorio_franz_db IS 'Sistema de Gestión para Laboratorio Clínico Franz - Base de datos principal';

-- Conectarse a la base de datos
\c laboratorio_franz_db

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Para encriptación
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Para búsquedas de texto similares

COMMENT ON EXTENSION "uuid-ossp" IS 'Generación de identificadores únicos universales';
COMMENT ON EXTENSION "pgcrypto" IS 'Funciones criptográficas para seguridad';
COMMENT ON EXTENSION "pg_trgm" IS 'Búsqueda de similitud de texto (trigrams)';
