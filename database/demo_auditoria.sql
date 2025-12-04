-- =====================================================
-- SCRIPT DE DEMOSTRACIÓN: Auditoría y Gestión de Logs
-- Ejecutar después de 07_auditoria_seguridad_triggers.sql
-- =====================================================

-- Mostrar mensaje de inicio
DO $$
BEGIN
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'DEMOSTRACIÓN DE AUDITORÍA Y GESTIÓN DE LOGS';
    RAISE NOTICE '====================================================';
END $$;

-- =====================================================
-- DEMO 1: Simular cambios en usuarios (Trigger automático)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📝 DEMO 1: Simulando cambios en tabla usuarios...';
END $$;

-- Crear usuario de prueba si no existe
INSERT INTO usuarios.usuario (
    codigo_rol, cedula, nombres, apellidos, email,
    password_hash, salt, activo
)
SELECT 1, '9999999999', 'Usuario', 'Demo Auditoria', 'demo.auditoria@test.com',
       'hash_temporal', 'salt_temporal', true
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios.usuario WHERE cedula = '9999999999'
);

-- Modificar el usuario (esto activará el trigger)
UPDATE usuarios.usuario
SET nombres = 'Usuario Modificado',
    apellidos = 'Demo Auditoria v2'
WHERE cedula = '9999999999';

-- =====================================================
-- DEMO 2: Simular intentos de login fallidos
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 DEMO 2: Simulando intentos de login fallidos...';
END $$;

-- Insertar intentos de login fallidos (simula fuerza bruta)
INSERT INTO auditoria.log_intento_login (identificador, ip_address, user_agent, exitoso, motivo_fallo)
VALUES
    ('hacker@test.com', '192.168.100.50', 'Mozilla/5.0 (Hacker Browser)', false, 'USUARIO_NO_EXISTE'),
    ('hacker@test.com', '192.168.100.50', 'Mozilla/5.0 (Hacker Browser)', false, 'USUARIO_NO_EXISTE'),
    ('hacker@test.com', '192.168.100.50', 'Mozilla/5.0 (Hacker Browser)', false, 'USUARIO_NO_EXISTE'),
    ('admin@lab.com', '192.168.100.50', 'Mozilla/5.0 (Hacker Browser)', false, 'CREDENCIALES_INVALIDAS'),
    ('admin@lab.com', '192.168.100.50', 'Mozilla/5.0 (Hacker Browser)', false, 'CREDENCIALES_INVALIDAS'),
    ('admin@lab.com', '192.168.100.50', 'Mozilla/5.0 (Hacker Browser)', false, 'CREDENCIALES_INVALIDAS');

-- El trigger fn_detectar_fuerza_bruta debería crear una alerta automáticamente

-- =====================================================
-- DEMO 3: Mostrar resultados de auditoría
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESULTADOS DE LA DEMOSTRACIÓN';
    RAISE NOTICE '================================';
END $$;

-- Mostrar historial de cambios en usuarios
SELECT '=== HISTORIAL DE CAMBIOS EN USUARIOS (old_value vs new_value) ===' AS titulo;

SELECT
    codigo_auditoria,
    operacion,
    COALESCE(datos_anteriores->>'nombres', '(nuevo)') AS nombre_anterior,
    COALESCE(datos_nuevos->>'nombres', '(eliminado)') AS nombre_nuevo,
    fecha_operacion
FROM auditoria.auditoria_tabla
WHERE tabla = 'usuarios.usuario'
ORDER BY fecha_operacion DESC
LIMIT 5;

-- Mostrar resumen de intentos de login
SELECT '=== RESUMEN DE INTENTOS DE LOGIN POR IP ===' AS titulo;

SELECT * FROM auditoria.v_resumen_intentos_login
LIMIT 5;

-- Mostrar alertas de seguridad
SELECT '=== ALERTAS DE SEGURIDAD ACTIVAS ===' AS titulo;

SELECT
    codigo_alerta,
    tipo_alerta,
    nivel,
    descripcion,
    ip_address,
    fecha_alerta
FROM auditoria.alerta_seguridad
WHERE resuelta = FALSE
ORDER BY
    CASE nivel WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END,
    fecha_alerta DESC
LIMIT 5;

-- =====================================================
-- DEMO 4: Consultas útiles para la exposición
-- =====================================================

SELECT '=== CONSULTA: ¿Quién modificó al usuario con cédula 9999999999? ===' AS titulo;

SELECT
    at.codigo_auditoria,
    at.operacion,
    at.datos_anteriores->>'nombres' AS "Nombre Anterior (old_value)",
    at.datos_nuevos->>'nombres' AS "Nombre Nuevo (new_value)",
    at.datos_anteriores->>'apellidos' AS "Apellido Anterior",
    at.datos_nuevos->>'apellidos' AS "Apellido Nuevo",
    at.fecha_operacion AS "Fecha del Cambio"
FROM auditoria.auditoria_tabla at
WHERE at.tabla = 'usuarios.usuario'
  AND (at.datos_anteriores->>'cedula' = '9999999999'
       OR at.datos_nuevos->>'cedula' = '9999999999')
ORDER BY at.fecha_operacion DESC;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

DO $$
DECLARE
    v_total_logs INTEGER;
    v_total_alertas INTEGER;
    v_total_auditoria INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_logs FROM auditoria.log_intento_login;
    SELECT COUNT(*) INTO v_total_alertas FROM auditoria.alerta_seguridad WHERE resuelta = FALSE;
    SELECT COUNT(*) INTO v_total_auditoria FROM auditoria.auditoria_tabla;

    RAISE NOTICE '';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'RESUMEN DE LA DEMOSTRACIÓN';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Total de intentos de login registrados: %', v_total_logs;
    RAISE NOTICE 'Alertas de seguridad activas: %', v_total_alertas;
    RAISE NOTICE 'Registros de auditoría (tablas espejo): %', v_total_auditoria;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Demostración completada exitosamente';
    RAISE NOTICE '====================================================';
END $$;

-- =====================================================
-- LIMPIEZA (Opcional - descomentar si se necesita)
-- =====================================================

-- DELETE FROM usuarios.usuario WHERE cedula = '9999999999';
-- DELETE FROM auditoria.log_intento_login WHERE ip_address = '192.168.100.50';
-- DELETE FROM auditoria.alerta_seguridad WHERE ip_address = '192.168.100.50';
