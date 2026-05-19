-- ============================================================
-- MODELO FÍSICO DE BASE DE DATOS
-- Sistema Web Laboratorio Clínico Franz
-- Motor: PostgreSQL 14+
-- Autor: Aguilar J., 2026.
-- ============================================================

-- ============================================================
-- CREACIÓN DE ESQUEMAS
-- ============================================================

CREATE SCHEMA IF NOT EXISTS usuarios;
CREATE SCHEMA IF NOT EXISTS catalogo;
CREATE SCHEMA IF NOT EXISTS resultados;
CREATE SCHEMA IF NOT EXISTS inventario;
CREATE SCHEMA IF NOT EXISTS comunicaciones;
CREATE SCHEMA IF NOT EXISTS auditoria;


-- ============================================================
-- ESQUEMA: usuarios
-- ============================================================

CREATE TABLE usuarios.rol (
    codigo_rol      SERIAL          PRIMARY KEY,
    nombre          VARCHAR(50)     NOT NULL UNIQUE,
    descripcion     TEXT,
    nivel_acceso    INTEGER         NOT NULL DEFAULT 1,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios.usuario (
    codigo_usuario                  SERIAL          PRIMARY KEY,
    codigo_rol                      INTEGER         NOT NULL,

    cedula                          VARCHAR(10)     NOT NULL UNIQUE,
    nombres                         VARCHAR(100)    NOT NULL,
    apellidos                       VARCHAR(100)    NOT NULL,
    email                           VARCHAR(100)    NOT NULL UNIQUE,
    telefono                        VARCHAR(15),
    fecha_nacimiento                DATE,
    genero                          VARCHAR(20),
    direccion                       TEXT,

    password_hash                   VARCHAR(255)    NOT NULL,
    salt                            VARCHAR(255)    NOT NULL,

    email_verificado                BOOLEAN         NOT NULL DEFAULT FALSE,
    telefono_verificado             BOOLEAN         NOT NULL DEFAULT FALSE,
    activo                          BOOLEAN         NOT NULL DEFAULT TRUE,

    intentos_fallidos               INTEGER         NOT NULL DEFAULT 0,
    cuenta_bloqueada                BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_bloqueo                   TIMESTAMP,
    ultima_conexion                 TIMESTAMP,
    ip_ultima_conexion              VARCHAR(45),

    contacto_emergencia_nombre      VARCHAR(200),
    contacto_emergencia_telefono    VARCHAR(15),

    fecha_creacion                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_actualizacion             TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (codigo_rol)
        REFERENCES usuarios.rol (codigo_rol)
);

CREATE TABLE usuarios.sesion (
    codigo_sesion       SERIAL          PRIMARY KEY,
    codigo_usuario      INTEGER         NOT NULL,
    refresh_token       VARCHAR(500)    NOT NULL UNIQUE,
    access_token_jti    VARCHAR(100),
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    fecha_creacion      TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_expiracion    TIMESTAMP       NOT NULL,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    revocado            BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_revocacion    TIMESTAMP,

    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE usuarios.token_recuperacion (
    codigo_token        SERIAL          PRIMARY KEY,
    codigo_usuario      INTEGER         NOT NULL,
    codigo              VARCHAR(6)      NOT NULL,
    email               VARCHAR(100)    NOT NULL,
    fecha_creacion      TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_expiracion    TIMESTAMP       NOT NULL,
    usado               BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_uso           TIMESTAMP,
    ip_address          VARCHAR(45),

    CONSTRAINT fk_token_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE usuarios.consentimiento (
    codigo_consentimiento   SERIAL          PRIMARY KEY,
    codigo_usuario          INTEGER         NOT NULL,
    tipo_consentimiento     VARCHAR(50)     NOT NULL,
    aceptado                BOOLEAN         NOT NULL,
    fecha_consentimiento    TIMESTAMP       NOT NULL DEFAULT NOW(),
    version_politica        VARCHAR(20),

    CONSTRAINT fk_consentimiento_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE usuarios.perfil_medico (
    codigo_perfil_medico    SERIAL      PRIMARY KEY,
    codigo_usuario          INTEGER     NOT NULL UNIQUE,
    tipo_sangre             VARCHAR(5),
    alergias                TEXT,
    condiciones_cronicas    TEXT,
    medicamentos_actuales   TEXT,
    cirugias_previas        TEXT,
    antecedentes_familiares TEXT,
    fecha_actualizacion     TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_perfil_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE usuarios.configuracion_sistema (
    codigo_config       SERIAL          PRIMARY KEY,
    clave               VARCHAR(100)    NOT NULL UNIQUE,
    valor               TEXT            NOT NULL,
    descripcion         TEXT,
    grupo               VARCHAR(50)     NOT NULL,
    tipo_dato           VARCHAR(20)     NOT NULL DEFAULT 'STRING',
    es_publico          BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_creacion      TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP       NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ESQUEMA: catalogo
-- ============================================================

CREATE TABLE catalogo.categoria_examen (
    codigo_categoria    SERIAL          PRIMARY KEY,
    nombre              VARCHAR(100)    NOT NULL UNIQUE,
    descripcion         TEXT,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE TABLE catalogo.examen (
    codigo_examen                   SERIAL          PRIMARY KEY,
    codigo_categoria                INTEGER,
    codigo_interno                  VARCHAR(50)     NOT NULL UNIQUE,
    nombre                          VARCHAR(200)    NOT NULL,
    descripcion                     TEXT,
    requiere_ayuno                  BOOLEAN         NOT NULL DEFAULT FALSE,
    horas_ayuno                     INTEGER,
    instrucciones_preparacion       TEXT,
    tiempo_entrega_horas            INTEGER         NOT NULL DEFAULT 24,
    tipo_muestra                    VARCHAR(100),
    valor_referencia_min            DECIMAL(10,4),
    valor_referencia_max            DECIMAL(10,4),
    valores_referencia_texto        TEXT,
    unidad_medida                   VARCHAR(50),
    activo                          BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_creacion                  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_examen_categoria
        FOREIGN KEY (codigo_categoria)
        REFERENCES catalogo.categoria_examen (codigo_categoria)
);


-- ============================================================
-- ESQUEMA: resultados
-- ============================================================

CREATE TABLE resultados.muestra (
    codigo_muestra      SERIAL          PRIMARY KEY,
    codigo_paciente     INTEGER         NOT NULL,
    tomada_por          INTEGER,
    id_muestra          VARCHAR(50)     NOT NULL UNIQUE,
    fecha_toma          TIMESTAMP       NOT NULL DEFAULT NOW(),
    tipo_muestra        VARCHAR(100),
    estado              VARCHAR(50)     NOT NULL DEFAULT 'RECOLECTADA',
    observaciones       TEXT,

    CONSTRAINT fk_muestra_paciente
        FOREIGN KEY (codigo_paciente)
        REFERENCES usuarios.usuario (codigo_usuario),

    CONSTRAINT fk_muestra_tomador
        FOREIGN KEY (tomada_por)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE resultados.resultado (
    codigo_resultado            SERIAL          PRIMARY KEY,
    codigo_muestra              INTEGER         NOT NULL,
    codigo_examen               INTEGER         NOT NULL,
    procesado_por               INTEGER,
    validado_por                INTEGER,

    valor_numerico              DECIMAL(15,6),
    valor_texto                 TEXT,
    unidad_medida               VARCHAR(50),
    dentro_rango_normal         BOOLEAN,
    nivel                       VARCHAR(20),
    observaciones_tecnicas      TEXT,
    valor_referencia_min        DECIMAL(10,4),
    valor_referencia_max        DECIMAL(10,4),
    valores_referencia_texto    TEXT,

    estado                      VARCHAR(50)     NOT NULL DEFAULT 'EN_PROCESO',
    fecha_resultado             TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_validacion            TIMESTAMP,
    url_pdf                     TEXT,
    codigo_verificacion         VARCHAR(100),

    CONSTRAINT fk_resultado_muestra
        FOREIGN KEY (codigo_muestra)
        REFERENCES resultados.muestra (codigo_muestra),

    CONSTRAINT fk_resultado_examen
        FOREIGN KEY (codigo_examen)
        REFERENCES catalogo.examen (codigo_examen),

    CONSTRAINT fk_resultado_procesador
        FOREIGN KEY (procesado_por)
        REFERENCES usuarios.usuario (codigo_usuario),

    CONSTRAINT fk_resultado_validador
        FOREIGN KEY (validado_por)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE resultados.descarga_resultado (
    codigo_descarga     SERIAL      PRIMARY KEY,
    codigo_resultado    INTEGER     NOT NULL,
    codigo_usuario      INTEGER     NOT NULL,
    fecha_descarga      TIMESTAMP   NOT NULL DEFAULT NOW(),
    ip_address          VARCHAR(45),
    user_agent          TEXT,

    CONSTRAINT fk_descarga_resultado
        FOREIGN KEY (codigo_resultado)
        REFERENCES resultados.resultado (codigo_resultado),

    CONSTRAINT fk_descarga_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);


-- ============================================================
-- ESQUEMA: inventario
-- ============================================================

CREATE TABLE inventario.categoria_item (
    codigo_categoria    SERIAL          PRIMARY KEY,
    nombre              VARCHAR(100)    NOT NULL UNIQUE,
    descripcion         TEXT,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE TABLE inventario.item (
    codigo_item             SERIAL          PRIMARY KEY,
    codigo_categoria        INTEGER,
    codigo_interno          VARCHAR(50)     NOT NULL UNIQUE,
    nombre                  VARCHAR(200)    NOT NULL,
    descripcion             TEXT,
    unidad_medida           VARCHAR(50)     NOT NULL,
    stock_actual            INTEGER         NOT NULL DEFAULT 0,
    stock_minimo            INTEGER         NOT NULL DEFAULT 0,
    stock_maximo            INTEGER,
    costo_unitario          DECIMAL(10,2),
    precio_venta            DECIMAL(10,2),
    es_reactivo             BOOLEAN         NOT NULL DEFAULT FALSE,
    vida_util_dias_abierto  INTEGER,
    capacidad_pruebas       INTEGER,
    activo                  BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_creacion          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_item_categoria
        FOREIGN KEY (codigo_categoria)
        REFERENCES inventario.categoria_item (codigo_categoria)
);

CREATE TABLE inventario.lote (
    codigo_lote                 SERIAL          PRIMARY KEY,
    codigo_item                 INTEGER         NOT NULL,
    numero_lote                 VARCHAR(100)    NOT NULL,
    fecha_fabricacion           DATE,
    fecha_vencimiento           DATE,
    cantidad_inicial            INTEGER         NOT NULL,
    cantidad_actual             INTEGER         NOT NULL,
    proveedor                   VARCHAR(200),
    fecha_ingreso               TIMESTAMP       NOT NULL DEFAULT NOW(),
    estado_lote                 VARCHAR(20)     NOT NULL DEFAULT 'CERRADO',
    fecha_apertura              TIMESTAMP,
    fecha_vencimiento_abierto   TIMESTAMP,
    pruebas_realizadas          INTEGER         NOT NULL DEFAULT 0,
    motivo_descarte             VARCHAR(100),
    fecha_descarte              TIMESTAMP,

    CONSTRAINT fk_lote_item
        FOREIGN KEY (codigo_item)
        REFERENCES inventario.item (codigo_item)
);

CREATE TABLE inventario.movimiento (
    codigo_movimiento   SERIAL          PRIMARY KEY,
    codigo_item         INTEGER         NOT NULL,
    codigo_lote         INTEGER,
    realizado_por       INTEGER,
    tipo_movimiento     VARCHAR(50)     NOT NULL,
    cantidad            INTEGER         NOT NULL,
    motivo              TEXT,
    referencia          VARCHAR(100),
    stock_anterior      INTEGER         NOT NULL,
    stock_nuevo         INTEGER         NOT NULL,
    fecha_movimiento    TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_movimiento_item
        FOREIGN KEY (codigo_item)
        REFERENCES inventario.item (codigo_item),

    CONSTRAINT fk_movimiento_lote
        FOREIGN KEY (codigo_lote)
        REFERENCES inventario.lote (codigo_lote),

    CONSTRAINT fk_movimiento_usuario
        FOREIGN KEY (realizado_por)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE inventario.proveedor (
    codigo_proveedor    SERIAL          PRIMARY KEY,
    ruc                 VARCHAR(13)     NOT NULL UNIQUE,
    razon_social        VARCHAR(200)    NOT NULL,
    nombre_comercial    VARCHAR(200),
    telefono            VARCHAR(15),
    email               VARCHAR(100),
    direccion           TEXT,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE inventario.orden_compra (
    codigo_orden_compra     SERIAL          PRIMARY KEY,
    codigo_proveedor        INTEGER         NOT NULL,
    creado_por              INTEGER,
    numero_orden            VARCHAR(50)     NOT NULL UNIQUE,
    fecha_orden             TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_entrega_estimada  DATE,
    fecha_entrega_real      TIMESTAMP,
    subtotal                DECIMAL(10,2)   NOT NULL DEFAULT 0,
    iva                     DECIMAL(10,2)   NOT NULL DEFAULT 0,
    total                   DECIMAL(10,2)   NOT NULL DEFAULT 0,
    estado                  VARCHAR(50)     NOT NULL DEFAULT 'BORRADOR',
    observaciones           TEXT,

    CONSTRAINT fk_orden_proveedor
        FOREIGN KEY (codigo_proveedor)
        REFERENCES inventario.proveedor (codigo_proveedor),

    CONSTRAINT fk_orden_creador
        FOREIGN KEY (creado_por)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE inventario.orden_compra_detalle (
    codigo_detalle          SERIAL          PRIMARY KEY,
    codigo_orden_compra     INTEGER         NOT NULL,
    codigo_item             INTEGER         NOT NULL,
    cantidad                INTEGER         NOT NULL,
    precio_unitario         DECIMAL(10,2)   NOT NULL,
    total_linea             DECIMAL(10,2)   NOT NULL,

    CONSTRAINT fk_detalle_orden
        FOREIGN KEY (codigo_orden_compra)
        REFERENCES inventario.orden_compra (codigo_orden_compra)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_item
        FOREIGN KEY (codigo_item)
        REFERENCES inventario.item (codigo_item)
);

CREATE TABLE inventario.examen_insumo (
    codigo_examen_insumo    SERIAL          PRIMARY KEY,
    codigo_examen           INTEGER         NOT NULL,
    codigo_item             INTEGER         NOT NULL,
    cantidad_requerida      DECIMAL(10,2)   NOT NULL,
    activo                  BOOLEAN         NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_examen_insumo_examen
        FOREIGN KEY (codigo_examen)
        REFERENCES catalogo.examen (codigo_examen),

    CONSTRAINT fk_examen_insumo_item
        FOREIGN KEY (codigo_item)
        REFERENCES inventario.item (codigo_item)
);

CREATE TABLE inventario.alerta_inventario (
    codigo_alerta       SERIAL      PRIMARY KEY,
    codigo_item         INTEGER     NOT NULL,
    resuelta_por        INTEGER,
    tipo_alerta         VARCHAR(50) NOT NULL,
    prioridad           VARCHAR(20) NOT NULL,
    mensaje             TEXT        NOT NULL,
    stock_actual        INTEGER,
    stock_minimo        INTEGER,
    fecha_vencimiento   DATE,
    resuelta            BOOLEAN     NOT NULL DEFAULT FALSE,
    fecha_resolucion    TIMESTAMP,
    fecha_creacion      TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alerta_item
        FOREIGN KEY (codigo_item)
        REFERENCES inventario.item (codigo_item)
);


-- ============================================================
-- ESQUEMA: comunicaciones
-- ============================================================

CREATE TABLE comunicaciones.conversacion (
    codigo_conversacion     SERIAL          PRIMARY KEY,
    codigo_usuario          INTEGER,
    tipo                    VARCHAR(50)     NOT NULL,
    estado                  VARCHAR(50)     NOT NULL DEFAULT 'ACTIVA',
    transferida_a_humano    BOOLEAN         NOT NULL DEFAULT FALSE,
    atendido_por            INTEGER,
    fecha_transferencia     TIMESTAMP,
    fecha_inicio            TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_fin               TIMESTAMP,
    ip_address              VARCHAR(45),
    user_agent              TEXT,

    CONSTRAINT fk_conv_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario),

    CONSTRAINT fk_conv_operador
        FOREIGN KEY (atendido_por)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE comunicaciones.mensaje (
    codigo_mensaje          SERIAL          PRIMARY KEY,
    codigo_conversacion     INTEGER         NOT NULL,
    remitente               VARCHAR(50)     NOT NULL,
    codigo_remitente        INTEGER,
    contenido               TEXT            NOT NULL,
    tipo_contenido          VARCHAR(50)     NOT NULL DEFAULT 'TEXTO',
    fecha_envio             TIMESTAMP       NOT NULL DEFAULT NOW(),
    leido                   BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_lectura           TIMESTAMP,
    intent                  VARCHAR(100),
    confidence              DECIMAL(5,4),

    CONSTRAINT fk_mensaje_conversacion
        FOREIGN KEY (codigo_conversacion)
        REFERENCES comunicaciones.conversacion (codigo_conversacion)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensaje_usuario
        FOREIGN KEY (codigo_remitente)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE comunicaciones.notificacion (
    codigo_notificacion     SERIAL          PRIMARY KEY,
    codigo_usuario          INTEGER         NOT NULL,
    tipo                    VARCHAR(50)     NOT NULL,
    asunto                  VARCHAR(200),
    contenido               TEXT            NOT NULL,
    tipo_referencia         VARCHAR(50),
    codigo_referencia       INTEGER,
    enviada                 BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_envio             TIMESTAMP,
    fecha_programada        TIMESTAMP,
    error                   TEXT,

    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);


-- ============================================================
-- ESQUEMA: auditoria
-- ============================================================

CREATE TABLE auditoria.log_actividad (
    codigo_log          SERIAL          PRIMARY KEY,
    codigo_usuario      INTEGER,
    accion              VARCHAR(100)    NOT NULL,
    entidad             VARCHAR(100),
    codigo_entidad      INTEGER,
    descripcion         TEXT,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    request_id          VARCHAR(100),
    datos_anteriores    JSONB,
    datos_nuevos        JSONB,
    fecha_accion        TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_log_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE auditoria.log_error (
    codigo_log_error    SERIAL          PRIMARY KEY,
    codigo_usuario      INTEGER,
    nivel               VARCHAR(20)     NOT NULL,
    mensaje             TEXT            NOT NULL,
    stack_trace         TEXT,
    endpoint            VARCHAR(200),
    metodo              VARCHAR(10),
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    request_id          VARCHAR(100),
    fecha_error         TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_log_error_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE auditoria.log_intento_login (
    codigo_intento      SERIAL          PRIMARY KEY,
    identificador       VARCHAR(100)    NOT NULL,
    ip_address          VARCHAR(45)     NOT NULL,
    user_agent          TEXT,
    exitoso             BOOLEAN         NOT NULL DEFAULT FALSE,
    motivo_fallo        VARCHAR(100),
    codigo_usuario      INTEGER,
    pais                VARCHAR(50),
    ciudad              VARCHAR(100),
    fecha_intento       TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_intento_usuario
        FOREIGN KEY (codigo_usuario)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE auditoria.alerta_seguridad (
    codigo_alerta       SERIAL      PRIMARY KEY,
    tipo_alerta         VARCHAR(50) NOT NULL,
    nivel               VARCHAR(20) NOT NULL,
    descripcion         TEXT        NOT NULL,
    ip_address          VARCHAR(45),
    codigo_usuario      INTEGER,
    datos_adicionales   JSONB,
    resuelta            BOOLEAN     NOT NULL DEFAULT FALSE,
    fecha_resolucion    TIMESTAMP,
    resuelta_por        INTEGER,
    fecha_alerta        TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE auditoria.auditoria_tabla (
    codigo_auditoria    SERIAL          PRIMARY KEY,
    tabla               VARCHAR(100)    NOT NULL,
    operacion           VARCHAR(10)     NOT NULL,
    codigo_registro     INTEGER,
    datos_anteriores    JSONB,
    datos_nuevos        JSONB,
    codigo_usuario      INTEGER,
    ip_address          VARCHAR(45),
    fecha_operacion     TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE auditoria.configuracion_chatbot (
    codigo_configuracion        SERIAL          PRIMARY KEY,
    activo                      BOOLEAN         NOT NULL DEFAULT TRUE,
    umbral_confianza            DECIMAL(3,2)    NOT NULL DEFAULT 0.70,
    mensaje_bienvenida          TEXT,
    mensaje_fallo               TEXT            NOT NULL DEFAULT 'Lo siento, no entendí tu consulta.',
    permitir_acceso_resultados  BOOLEAN         NOT NULL DEFAULT FALSE,
    fecha_actualizacion         TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE auditoria.conversacion_chatbot (
    codigo_conversacion SERIAL          PRIMARY KEY,
    codigo_paciente     INTEGER,
    session_id          VARCHAR(200)    NOT NULL UNIQUE,
    fecha_inicio        TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_ultimo_msg    TIMESTAMP       NOT NULL DEFAULT NOW(),
    activa              BOOLEAN         NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_chatbot_paciente
        FOREIGN KEY (codigo_paciente)
        REFERENCES usuarios.usuario (codigo_usuario)
);

CREATE TABLE auditoria.mensaje_chatbot (
    codigo_mensaje          SERIAL          PRIMARY KEY,
    codigo_conversacion     INTEGER         NOT NULL,
    remitente               VARCHAR(10)     NOT NULL,
    contenido               TEXT            NOT NULL,
    intent                  VARCHAR(200),
    confianza               DECIMAL(3,2),
    timestamp               TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_msg_chatbot_conv
        FOREIGN KEY (codigo_conversacion)
        REFERENCES auditoria.conversacion_chatbot (codigo_conversacion)
        ON DELETE CASCADE
);


-- ============================================================
-- ÍNDICES
-- ============================================================

-- usuarios
CREATE INDEX idx_usuario_rol          ON usuarios.usuario (codigo_rol);
CREATE INDEX idx_usuario_email        ON usuarios.usuario (email);
CREATE INDEX idx_usuario_cedula       ON usuarios.usuario (cedula);
CREATE INDEX idx_sesion_usuario       ON usuarios.sesion (codigo_usuario);
CREATE INDEX idx_token_usuario_email  ON usuarios.token_recuperacion (codigo_usuario, email);

-- catalogo
CREATE INDEX idx_examen_categoria     ON catalogo.examen (codigo_categoria);

-- resultados
CREATE INDEX idx_muestra_paciente     ON resultados.muestra (codigo_paciente);
CREATE INDEX idx_resultado_muestra    ON resultados.resultado (codigo_muestra);
CREATE INDEX idx_resultado_examen     ON resultados.resultado (codigo_examen);
CREATE INDEX idx_resultado_estado     ON resultados.resultado (estado);

-- inventario
CREATE INDEX idx_item_categoria       ON inventario.item (codigo_categoria);
CREATE INDEX idx_lote_item            ON inventario.lote (codigo_item);
CREATE INDEX idx_lote_vencimiento     ON inventario.lote (fecha_vencimiento);
CREATE INDEX idx_movimiento_item      ON inventario.movimiento (codigo_item);
CREATE INDEX idx_movimiento_fecha     ON inventario.movimiento (fecha_movimiento);
CREATE INDEX idx_alerta_item          ON inventario.alerta_inventario (codigo_item);
CREATE INDEX idx_alerta_resuelta      ON inventario.alerta_inventario (resuelta);
CREATE INDEX idx_examen_insumo_examen ON inventario.examen_insumo (codigo_examen);

-- comunicaciones
CREATE INDEX idx_mensaje_conversacion ON comunicaciones.mensaje (codigo_conversacion);
CREATE INDEX idx_notif_usuario        ON comunicaciones.notificacion (codigo_usuario);
CREATE INDEX idx_notif_enviada        ON comunicaciones.notificacion (enviada);

-- auditoria
CREATE INDEX idx_log_usuario          ON auditoria.log_actividad (codigo_usuario);
CREATE INDEX idx_log_fecha            ON auditoria.log_actividad (fecha_accion);
CREATE INDEX idx_intento_ip           ON auditoria.log_intento_login (ip_address);
CREATE INDEX idx_intento_fecha        ON auditoria.log_intento_login (fecha_intento);
CREATE INDEX idx_chatbot_session      ON auditoria.conversacion_chatbot (session_id);
CREATE INDEX idx_chatbot_paciente     ON auditoria.conversacion_chatbot (codigo_paciente);
CREATE INDEX idx_msg_chatbot          ON auditoria.mensaje_chatbot (codigo_conversacion);
CREATE INDEX idx_auditoria_tabla      ON auditoria.auditoria_tabla (tabla);
CREATE INDEX idx_auditoria_fecha      ON auditoria.auditoria_tabla (fecha_operacion);
