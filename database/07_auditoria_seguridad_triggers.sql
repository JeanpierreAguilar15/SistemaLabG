-- =====================================================
-- SCRIPT: Esquema de Auditoría y Gestión de Logs
-- Autor: Sistema de Laboratorio Franz
-- Descripción: Implementa tablas de seguridad y triggers
--              para auditoría automática de cambios
-- =====================================================

-- Usar el esquema de auditoría
SET search_path TO auditoria, public;

-- =====================================================
-- 1. TABLA: log_intento_login
-- Registra TODOS los intentos de login (exitosos y fallidos)
-- Permite detectar ataques de fuerza bruta
-- =====================================================

CREATE TABLE IF NOT EXISTS auditoria.log_intento_login (
    codigo_intento      SERIAL PRIMARY KEY,
    identificador       VARCHAR(100) NOT NULL,      -- email o cédula usada
    ip_address          VARCHAR(45) NOT NULL,       -- IPv4 o IPv6
    user_agent          TEXT,                       -- Navegador/cliente
    exitoso             BOOLEAN DEFAULT FALSE,      -- TRUE = login exitoso
    motivo_fallo        VARCHAR(100),               -- CREDENCIALES_INVALIDAS, CUENTA_BLOQUEADA, etc.
    codigo_usuario      INTEGER REFERENCES usuarios.usuario(codigo_usuario),
    pais                VARCHAR(50),                -- Geolocalización (opcional)
    ciudad              VARCHAR(100),
    fecha_intento       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_log_intento_ip ON auditoria.log_intento_login(ip_address);
CREATE INDEX IF NOT EXISTS idx_log_intento_identificador ON auditoria.log_intento_login(identificador);
CREATE INDEX IF NOT EXISTS idx_log_intento_fecha ON auditoria.log_intento_login(fecha_intento);
CREATE INDEX IF NOT EXISTS idx_log_intento_exitoso ON auditoria.log_intento_login(exitoso);

COMMENT ON TABLE auditoria.log_intento_login IS 'Registra todos los intentos de login para detectar ataques de fuerza bruta';
COMMENT ON COLUMN auditoria.log_intento_login.motivo_fallo IS 'Razón del fallo: CREDENCIALES_INVALIDAS, CUENTA_BLOQUEADA, CUENTA_INACTIVA, USUARIO_NO_EXISTE';

-- =====================================================
-- 2. TABLA: alerta_seguridad
-- Almacena alertas generadas por el sistema de seguridad
-- =====================================================

CREATE TABLE IF NOT EXISTS auditoria.alerta_seguridad (
    codigo_alerta       SERIAL PRIMARY KEY,
    tipo_alerta         VARCHAR(50) NOT NULL,       -- FUERZA_BRUTA, MULTIPLES_IPS, CUENTA_BLOQUEADA
    nivel               VARCHAR(20) NOT NULL,       -- INFO, WARNING, CRITICAL
    descripcion         TEXT NOT NULL,
    ip_address          VARCHAR(45),
    codigo_usuario      INTEGER,
    datos_adicionales   JSONB,                      -- Información extra en JSON
    resuelta            BOOLEAN DEFAULT FALSE,
    fecha_resolucion    TIMESTAMP,
    resuelta_por        INTEGER,
    fecha_alerta        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerta_tipo ON auditoria.alerta_seguridad(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alerta_nivel ON auditoria.alerta_seguridad(nivel);
CREATE INDEX IF NOT EXISTS idx_alerta_fecha ON auditoria.alerta_seguridad(fecha_alerta);
CREATE INDEX IF NOT EXISTS idx_alerta_resuelta ON auditoria.alerta_seguridad(resuelta);

COMMENT ON TABLE auditoria.alerta_seguridad IS 'Alertas de seguridad generadas automáticamente por el sistema';

-- =====================================================
-- 3. TABLA: auditoria_tabla (Tablas Espejo / Históricas)
-- Registra cambios en tablas críticas con old_value vs new_value
-- =====================================================

CREATE TABLE IF NOT EXISTS auditoria.auditoria_tabla (
    codigo_auditoria    SERIAL PRIMARY KEY,
    tabla               VARCHAR(100) NOT NULL,      -- Nombre de la tabla afectada
    operacion           VARCHAR(10) NOT NULL,       -- INSERT, UPDATE, DELETE
    codigo_registro     INTEGER,                    -- PK del registro afectado
    datos_anteriores    JSONB,                      -- old_value (antes del cambio)
    datos_nuevos        JSONB,                      -- new_value (después del cambio)
    codigo_usuario      INTEGER,                    -- Usuario que hizo el cambio
    ip_address          VARCHAR(45),
    fecha_operacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON auditoria.auditoria_tabla(tabla);
CREATE INDEX IF NOT EXISTS idx_auditoria_operacion ON auditoria.auditoria_tabla(operacion);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria.auditoria_tabla(fecha_operacion);

COMMENT ON TABLE auditoria.auditoria_tabla IS 'Tabla espejo para auditoría: registra old_value vs new_value de cambios críticos';

-- =====================================================
-- 4. FUNCIÓN GENÉRICA PARA TRIGGERS DE AUDITORÍA
-- Esta función captura INSERT, UPDATE, DELETE automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION auditoria.fn_trigger_auditoria()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_pk_column TEXT;
    v_pk_value INTEGER;
    v_usuario_id INTEGER;
BEGIN
    -- Obtener el nombre de la columna PK (asumimos formato codigo_*)
    v_pk_column := TG_ARGV[0];

    -- Obtener el usuario actual de la sesión (si está configurado)
    BEGIN
        v_usuario_id := current_setting('app.current_user_id', true)::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        -- Para INSERT: solo datos nuevos
        v_new_data := to_jsonb(NEW);
        EXECUTE format('SELECT ($1).%I', v_pk_column) INTO v_pk_value USING NEW;

        INSERT INTO auditoria.auditoria_tabla (
            tabla, operacion, codigo_registro, datos_anteriores, datos_nuevos, codigo_usuario
        ) VALUES (
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            'INSERT',
            v_pk_value,
            NULL,
            v_new_data,
            v_usuario_id
        );
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Para UPDATE: datos anteriores y nuevos
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        EXECUTE format('SELECT ($1).%I', v_pk_column) INTO v_pk_value USING NEW;

        -- Solo registrar si hay cambios reales
        IF v_old_data IS DISTINCT FROM v_new_data THEN
            INSERT INTO auditoria.auditoria_tabla (
                tabla, operacion, codigo_registro, datos_anteriores, datos_nuevos, codigo_usuario
            ) VALUES (
                TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
                'UPDATE',
                v_pk_value,
                v_old_data,
                v_new_data,
                v_usuario_id
            );
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Para DELETE: solo datos anteriores
        v_old_data := to_jsonb(OLD);
        EXECUTE format('SELECT ($1).%I', v_pk_column) INTO v_pk_value USING OLD;

        INSERT INTO auditoria.auditoria_tabla (
            tabla, operacion, codigo_registro, datos_anteriores, datos_nuevos, codigo_usuario
        ) VALUES (
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            'DELETE',
            v_pk_value,
            v_old_data,
            NULL,
            v_usuario_id
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auditoria.fn_trigger_auditoria() IS 'Función genérica para triggers de auditoría. Captura old_value vs new_value';

-- =====================================================
-- 5. TRIGGERS DE AUDITORÍA EN TABLAS CRÍTICAS
-- =====================================================

-- -------- TRIGGER: usuarios.usuario --------
-- Responde: ¿Quién modificó este usuario? ¿Cuándo? ¿Qué cambió?

DROP TRIGGER IF EXISTS trg_auditoria_usuario ON usuarios.usuario;
CREATE TRIGGER trg_auditoria_usuario
    AFTER INSERT OR UPDATE OR DELETE ON usuarios.usuario
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_usuario');

-- -------- TRIGGER: usuarios.rol --------
DROP TRIGGER IF EXISTS trg_auditoria_rol ON usuarios.rol;
CREATE TRIGGER trg_auditoria_rol
    AFTER INSERT OR UPDATE OR DELETE ON usuarios.rol
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_rol');

-- -------- TRIGGER: catalogo.examen --------
DROP TRIGGER IF EXISTS trg_auditoria_examen ON catalogo.examen;
CREATE TRIGGER trg_auditoria_examen
    AFTER INSERT OR UPDATE OR DELETE ON catalogo.examen
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_examen');

-- -------- TRIGGER: catalogo.precio --------
-- Muy importante: registra cambios de precios
DROP TRIGGER IF EXISTS trg_auditoria_precio ON catalogo.precio;
CREATE TRIGGER trg_auditoria_precio
    AFTER INSERT OR UPDATE OR DELETE ON catalogo.precio
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_precio');

-- -------- TRIGGER: pagos.pago --------
DROP TRIGGER IF EXISTS trg_auditoria_pago ON pagos.pago;
CREATE TRIGGER trg_auditoria_pago
    AFTER INSERT OR UPDATE OR DELETE ON pagos.pago
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_pago');

-- -------- TRIGGER: resultados.resultado --------
DROP TRIGGER IF EXISTS trg_auditoria_resultado ON resultados.resultado;
CREATE TRIGGER trg_auditoria_resultado
    AFTER INSERT OR UPDATE OR DELETE ON resultados.resultado
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_resultado');

-- -------- TRIGGER: inventario.movimiento --------
DROP TRIGGER IF EXISTS trg_auditoria_movimiento ON inventario.movimiento;
CREATE TRIGGER trg_auditoria_movimiento
    AFTER INSERT OR UPDATE OR DELETE ON inventario.movimiento
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_movimiento');

-- =====================================================
-- 6. FUNCIÓN: Detectar ataques de fuerza bruta
-- Se ejecuta automáticamente después de cada intento fallido
-- =====================================================

CREATE OR REPLACE FUNCTION auditoria.fn_detectar_fuerza_bruta()
RETURNS TRIGGER AS $$
DECLARE
    v_intentos_recientes INTEGER;
    v_umbral_alerta INTEGER := 5;           -- Alertar después de 5 intentos
    v_umbral_critico INTEGER := 10;         -- Crítico después de 10 intentos
    v_ventana_tiempo INTERVAL := '15 minutes'; -- Ventana de tiempo
BEGIN
    -- Solo procesar intentos fallidos
    IF NEW.exitoso = TRUE THEN
        RETURN NEW;
    END IF;

    -- Contar intentos fallidos de esta IP en la ventana de tiempo
    SELECT COUNT(*) INTO v_intentos_recientes
    FROM auditoria.log_intento_login
    WHERE ip_address = NEW.ip_address
      AND exitoso = FALSE
      AND fecha_intento > (CURRENT_TIMESTAMP - v_ventana_tiempo);

    -- Generar alerta si supera el umbral
    IF v_intentos_recientes >= v_umbral_critico THEN
        INSERT INTO auditoria.alerta_seguridad (
            tipo_alerta, nivel, descripcion, ip_address, codigo_usuario, datos_adicionales
        ) VALUES (
            'FUERZA_BRUTA',
            'CRITICAL',
            format('ALERTA CRÍTICA: %s intentos fallidos desde IP %s en los últimos 15 minutos',
                   v_intentos_recientes, NEW.ip_address),
            NEW.ip_address,
            NEW.codigo_usuario,
            jsonb_build_object(
                'intentos_recientes', v_intentos_recientes,
                'identificador_usado', NEW.identificador,
                'user_agent', NEW.user_agent
            )
        );
    ELSIF v_intentos_recientes >= v_umbral_alerta THEN
        INSERT INTO auditoria.alerta_seguridad (
            tipo_alerta, nivel, descripcion, ip_address, codigo_usuario, datos_adicionales
        ) VALUES (
            'FUERZA_BRUTA',
            'WARNING',
            format('Posible ataque de fuerza bruta: %s intentos fallidos desde IP %s',
                   v_intentos_recientes, NEW.ip_address),
            NEW.ip_address,
            NEW.codigo_usuario,
            jsonb_build_object(
                'intentos_recientes', v_intentos_recientes,
                'identificador_usado', NEW.identificador
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar fuerza bruta automáticamente
DROP TRIGGER IF EXISTS trg_detectar_fuerza_bruta ON auditoria.log_intento_login;
CREATE TRIGGER trg_detectar_fuerza_bruta
    AFTER INSERT ON auditoria.log_intento_login
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_detectar_fuerza_bruta();

COMMENT ON FUNCTION auditoria.fn_detectar_fuerza_bruta() IS 'Detecta automáticamente ataques de fuerza bruta basado en intentos de login fallidos';

-- =====================================================
-- 7. VISTAS ÚTILES PARA CONSULTAS DE SEGURIDAD
-- =====================================================

-- Vista: Resumen de intentos de login por IP (últimas 24 horas)
CREATE OR REPLACE VIEW auditoria.v_resumen_intentos_login AS
SELECT
    ip_address,
    COUNT(*) as total_intentos,
    SUM(CASE WHEN exitoso THEN 1 ELSE 0 END) as intentos_exitosos,
    SUM(CASE WHEN NOT exitoso THEN 1 ELSE 0 END) as intentos_fallidos,
    COUNT(DISTINCT identificador) as identificadores_distintos,
    MIN(fecha_intento) as primer_intento,
    MAX(fecha_intento) as ultimo_intento
FROM auditoria.log_intento_login
WHERE fecha_intento > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY intentos_fallidos DESC;

COMMENT ON VIEW auditoria.v_resumen_intentos_login IS 'Resumen de intentos de login por IP en las últimas 24 horas';

-- Vista: Alertas activas (no resueltas)
CREATE OR REPLACE VIEW auditoria.v_alertas_activas AS
SELECT
    codigo_alerta,
    tipo_alerta,
    nivel,
    descripcion,
    ip_address,
    codigo_usuario,
    datos_adicionales,
    fecha_alerta,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_alerta))/3600 as horas_desde_alerta
FROM auditoria.alerta_seguridad
WHERE resuelta = FALSE
ORDER BY
    CASE nivel
        WHEN 'CRITICAL' THEN 1
        WHEN 'WARNING' THEN 2
        ELSE 3
    END,
    fecha_alerta DESC;

COMMENT ON VIEW auditoria.v_alertas_activas IS 'Muestra alertas de seguridad pendientes de resolver, ordenadas por criticidad';

-- Vista: Historial de cambios en usuarios (auditoría tabla espejo)
CREATE OR REPLACE VIEW auditoria.v_historial_cambios_usuarios AS
SELECT
    codigo_auditoria,
    operacion,
    codigo_registro as codigo_usuario,
    datos_anteriores->>'nombres' as nombres_anterior,
    datos_nuevos->>'nombres' as nombres_nuevo,
    datos_anteriores->>'email' as email_anterior,
    datos_nuevos->>'email' as email_nuevo,
    datos_anteriores->>'activo' as activo_anterior,
    datos_nuevos->>'activo' as activo_nuevo,
    fecha_operacion
FROM auditoria.auditoria_tabla
WHERE tabla = 'usuarios.usuario'
ORDER BY fecha_operacion DESC;

COMMENT ON VIEW auditoria.v_historial_cambios_usuarios IS 'Historial de cambios en la tabla de usuarios con old_value vs new_value';

-- =====================================================
-- 8. FUNCIÓN: Limpieza automática de logs antiguos
-- (Opcional: ejecutar periódicamente con pg_cron o cron job)
-- =====================================================

CREATE OR REPLACE FUNCTION auditoria.fn_limpiar_logs_antiguos(
    p_dias_retencion INTEGER DEFAULT 90
)
RETURNS TABLE(tabla_afectada TEXT, registros_eliminados BIGINT) AS $$
DECLARE
    v_fecha_corte TIMESTAMP := CURRENT_TIMESTAMP - (p_dias_retencion || ' days')::INTERVAL;
    v_count BIGINT;
BEGIN
    -- Limpiar log_intento_login
    DELETE FROM auditoria.log_intento_login WHERE fecha_intento < v_fecha_corte;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    tabla_afectada := 'log_intento_login';
    registros_eliminados := v_count;
    RETURN NEXT;

    -- Limpiar alertas resueltas antiguas
    DELETE FROM auditoria.alerta_seguridad
    WHERE resuelta = TRUE AND fecha_resolucion < v_fecha_corte;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    tabla_afectada := 'alerta_seguridad';
    registros_eliminados := v_count;
    RETURN NEXT;

    -- Limpiar auditoria_tabla (mantener más tiempo: 180 días)
    DELETE FROM auditoria.auditoria_tabla
    WHERE fecha_operacion < (CURRENT_TIMESTAMP - '180 days'::INTERVAL);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    tabla_afectada := 'auditoria_tabla';
    registros_eliminados := v_count;
    RETURN NEXT;

    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auditoria.fn_limpiar_logs_antiguos(INTEGER) IS 'Limpia logs antiguos. Ejecutar periódicamente para mantener el tamaño de la BD';

-- =====================================================
-- EJEMPLOS DE CONSULTAS ÚTILES
-- =====================================================

/*
-- 1. ¿Quién modificó este usuario y cuándo?
SELECT * FROM auditoria.v_historial_cambios_usuarios
WHERE codigo_usuario = 123;

-- 2. Ver todas las alertas críticas activas
SELECT * FROM auditoria.v_alertas_activas
WHERE nivel = 'CRITICAL';

-- 3. IPs sospechosas con muchos intentos fallidos
SELECT * FROM auditoria.v_resumen_intentos_login
WHERE intentos_fallidos > 5;

-- 4. Historial completo de cambios en precios
SELECT
    at.codigo_auditoria,
    at.operacion,
    at.datos_anteriores->>'precio' as precio_anterior,
    at.datos_nuevos->>'precio' as precio_nuevo,
    at.fecha_operacion
FROM auditoria.auditoria_tabla at
WHERE at.tabla = 'catalogo.precio'
ORDER BY at.fecha_operacion DESC;

-- 5. Ejecutar limpieza de logs (mantener últimos 90 días)
SELECT * FROM auditoria.fn_limpiar_logs_antiguos(90);
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
