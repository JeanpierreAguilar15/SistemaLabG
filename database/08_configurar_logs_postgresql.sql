-- =====================================================
-- CONFIGURACIÓN DE LOGS DE POSTGRESQL
-- Para: Laboratorio Franz
-- Ejecutar en pgAdmin como superusuario (postgres)
-- =====================================================

-- Verificar que estamos conectados como superusuario
DO $$
BEGIN
    IF NOT (SELECT usesuper FROM pg_user WHERE usename = current_user) THEN
        RAISE EXCEPTION 'Debes ejecutar esto como superusuario (postgres)';
    END IF;
    RAISE NOTICE 'Conectado como superusuario: %', current_user;
END $$;

-- =====================================================
-- 1. CONFIGURAR RECOLECCIÓN DE LOGS
-- =====================================================

-- Activar recolector de logs (guarda en archivos)
ALTER SYSTEM SET logging_collector = 'on';

-- Carpeta donde guardar los logs (relativa a data/)
ALTER SYSTEM SET log_directory = 'log';

-- Nombre del archivo (un archivo por día)
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d.log';

-- Rotar logs cada día
ALTER SYSTEM SET log_rotation_age = '1d';

-- Rotar si el archivo supera 100MB
ALTER SYSTEM SET log_rotation_size = '100MB';

-- =====================================================
-- 2. LOGUEAR CONEXIONES (Seguridad)
-- =====================================================

-- Registrar cada nueva conexión
ALTER SYSTEM SET log_connections = 'on';

-- Registrar cada desconexión
ALTER SYSTEM SET log_disconnections = 'on';

-- =====================================================
-- 3. LOGUEAR CONSULTAS LENTAS (Performance)
-- =====================================================

-- Loguear consultas que tarden más de 1000ms (1 segundo)
-- Ajusta este valor según necesites:
-- 500 = medio segundo (más estricto)
-- 1000 = un segundo (recomendado)
-- 5000 = cinco segundos (más permisivo)
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- =====================================================
-- 4. FORMATO DE LOG (Información útil)
-- =====================================================

-- Incluir: timestamp, PID, usuario, base de datos, app, IP cliente
ALTER SYSTEM SET log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a,client=%h ';

-- Nivel mínimo de mensajes a loguear
ALTER SYSTEM SET log_min_messages = 'warning';

-- Nivel de errores a enviar al cliente
ALTER SYSTEM SET client_min_messages = 'notice';

-- =====================================================
-- 5. QUÉ STATEMENTS LOGUEAR
-- =====================================================

-- Opciones:
-- 'none' = nada (solo errores)
-- 'ddl'  = CREATE, ALTER, DROP (cambios de estructura)
-- 'mod'  = ddl + INSERT, UPDATE, DELETE (cambios de datos)
-- 'all'  = TODO (puede generar MUCHOS logs, usar con cuidado)

-- Para auditoría básica, 'ddl' es suficiente
-- Los INSERT/UPDATE/DELETE ya los capturan los triggers
ALTER SYSTEM SET log_statement = 'ddl';

-- =====================================================
-- 6. LOGUEAR PROBLEMAS DE RENDIMIENTO
-- =====================================================

-- Loguear checkpoints (mantenimiento interno de PostgreSQL)
ALTER SYSTEM SET log_checkpoints = 'on';

-- Loguear bloqueos que tarden más de 1 segundo
ALTER SYSTEM SET log_lock_waits = 'on';

-- Timeout para detectar deadlocks
ALTER SYSTEM SET deadlock_timeout = '1s';

-- =====================================================
-- 7. VERIFICAR CONFIGURACIÓN
-- =====================================================

SELECT '=== CONFIGURACIÓN DE LOGGING APLICADA ===' AS info;

SELECT
    name AS parametro,
    setting AS valor_actual,
    pending_restart AS requiere_reinicio
FROM pg_settings
WHERE name IN (
    'logging_collector',
    'log_directory',
    'log_filename',
    'log_connections',
    'log_disconnections',
    'log_min_duration_statement',
    'log_statement',
    'log_checkpoints',
    'log_lock_waits'
)
ORDER BY name;

-- =====================================================
-- IMPORTANTE: REINICIAR POSTGRESQL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CONFIGURACIÓN APLICADA EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'SIGUIENTE PASO: Reiniciar PostgreSQL para que tome efecto';
    RAISE NOTICE '';
    RAISE NOTICE 'En PowerShell (como Administrador):';
    RAISE NOTICE '  net stop postgresql-x64-16';
    RAISE NOTICE '  net start postgresql-x64-16';
    RAISE NOTICE '';
    RAISE NOTICE 'O en Servicios de Windows:';
    RAISE NOTICE '  1. Win + R -> services.msc';
    RAISE NOTICE '  2. Buscar "postgresql-x64-16"';
    RAISE NOTICE '  3. Click derecho -> Reiniciar';
    RAISE NOTICE '';
    RAISE NOTICE 'Los logs se guardarán en:';
    RAISE NOTICE '  C:\Program Files\PostgreSQL\16\data\log\';
    RAISE NOTICE '=====================================================';
END $$;
