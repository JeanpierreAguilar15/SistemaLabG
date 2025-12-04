-- =====================================================
-- SCRIPT: Triggers y Funciones de Auditoría
-- IMPORTANTE: Las TABLAS las crea Prisma con 'npx prisma db push'
-- Este script SOLO crea: Funciones, Triggers y Vistas
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN GENÉRICA PARA TRIGGERS DE AUDITORÍA
-- Captura INSERT, UPDATE, DELETE automáticamente
-- Guarda old_value vs new_value
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

-- =====================================================
-- 2. TRIGGERS EN TABLAS CRÍTICAS
-- =====================================================

-- Trigger: usuarios.usuario
DROP TRIGGER IF EXISTS trg_auditoria_usuario ON usuarios.usuario;
CREATE TRIGGER trg_auditoria_usuario
    AFTER INSERT OR UPDATE OR DELETE ON usuarios.usuario
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_usuario');

-- Trigger: usuarios.rol
DROP TRIGGER IF EXISTS trg_auditoria_rol ON usuarios.rol;
CREATE TRIGGER trg_auditoria_rol
    AFTER INSERT OR UPDATE OR DELETE ON usuarios.rol
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_rol');

-- Trigger: catalogo.examen
DROP TRIGGER IF EXISTS trg_auditoria_examen ON catalogo.examen;
CREATE TRIGGER trg_auditoria_examen
    AFTER INSERT OR UPDATE OR DELETE ON catalogo.examen
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_examen');

-- Trigger: catalogo.precio (muy importante para auditar cambios de precios)
DROP TRIGGER IF EXISTS trg_auditoria_precio ON catalogo.precio;
CREATE TRIGGER trg_auditoria_precio
    AFTER INSERT OR UPDATE OR DELETE ON catalogo.precio
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_precio');

-- Trigger: pagos.pago
DROP TRIGGER IF EXISTS trg_auditoria_pago ON pagos.pago;
CREATE TRIGGER trg_auditoria_pago
    AFTER INSERT OR UPDATE OR DELETE ON pagos.pago
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_pago');

-- Trigger: resultados.resultado
DROP TRIGGER IF EXISTS trg_auditoria_resultado ON resultados.resultado;
CREATE TRIGGER trg_auditoria_resultado
    AFTER INSERT OR UPDATE OR DELETE ON resultados.resultado
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_trigger_auditoria('codigo_resultado');

-- =====================================================
-- 3. FUNCIÓN: Detectar ataques de fuerza bruta
-- Se ejecuta automáticamente después de cada intento fallido
-- =====================================================

CREATE OR REPLACE FUNCTION auditoria.fn_detectar_fuerza_bruta()
RETURNS TRIGGER AS $$
DECLARE
    v_intentos_recientes INTEGER;
    v_umbral_alerta INTEGER := 5;
    v_umbral_critico INTEGER := 10;
    v_ventana_tiempo INTERVAL := '15 minutes';
BEGIN
    IF NEW.exitoso = TRUE THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_intentos_recientes
    FROM auditoria.log_intento_login
    WHERE ip_address = NEW.ip_address
      AND exitoso = FALSE
      AND fecha_intento > (CURRENT_TIMESTAMP - v_ventana_tiempo);

    IF v_intentos_recientes >= v_umbral_critico THEN
        INSERT INTO auditoria.alerta_seguridad (
            tipo_alerta, nivel, descripcion, ip_address, codigo_usuario, datos_adicionales
        ) VALUES (
            'FUERZA_BRUTA',
            'CRITICAL',
            format('ALERTA CRÍTICA: %s intentos fallidos desde IP %s en 15 min',
                   v_intentos_recientes, NEW.ip_address),
            NEW.ip_address,
            NEW.codigo_usuario,
            jsonb_build_object('intentos', v_intentos_recientes, 'identificador', NEW.identificador)
        );
    ELSIF v_intentos_recientes >= v_umbral_alerta THEN
        INSERT INTO auditoria.alerta_seguridad (
            tipo_alerta, nivel, descripcion, ip_address, codigo_usuario, datos_adicionales
        ) VALUES (
            'FUERZA_BRUTA',
            'WARNING',
            format('Posible fuerza bruta: %s intentos fallidos desde IP %s',
                   v_intentos_recientes, NEW.ip_address),
            NEW.ip_address,
            NEW.codigo_usuario,
            jsonb_build_object('intentos', v_intentos_recientes)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar fuerza bruta
DROP TRIGGER IF EXISTS trg_detectar_fuerza_bruta ON auditoria.log_intento_login;
CREATE TRIGGER trg_detectar_fuerza_bruta
    AFTER INSERT ON auditoria.log_intento_login
    FOR EACH ROW EXECUTE FUNCTION auditoria.fn_detectar_fuerza_bruta();

-- =====================================================
-- 4. VISTAS ÚTILES PARA CONSULTAS
-- =====================================================

-- Vista: Resumen de intentos de login por IP
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

-- Vista: Alertas activas
CREATE OR REPLACE VIEW auditoria.v_alertas_activas AS
SELECT
    codigo_alerta,
    tipo_alerta,
    nivel,
    descripcion,
    ip_address,
    codigo_usuario,
    datos_adicionales,
    fecha_alerta
FROM auditoria.alerta_seguridad
WHERE resuelta = FALSE
ORDER BY
    CASE nivel WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END,
    fecha_alerta DESC;

-- Vista: Historial de cambios en usuarios
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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Triggers y funciones creados exitosamente';
    RAISE NOTICE '   - fn_trigger_auditoria (función genérica)';
    RAISE NOTICE '   - fn_detectar_fuerza_bruta (detección automática)';
    RAISE NOTICE '   - Triggers en: usuario, rol, examen, precio, pago, resultado';
    RAISE NOTICE '   - Vistas: v_resumen_intentos_login, v_alertas_activas, v_historial_cambios_usuarios';
END $$;
