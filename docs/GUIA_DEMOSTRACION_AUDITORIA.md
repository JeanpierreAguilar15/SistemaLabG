# 🎓 Guía de Demostración: Esquema de Auditoría y Gestión de Logs

## Información del Proyecto
- **Materia:** Seguridad Informática
- **Tema:** Esquema de Auditoría (9) y Gestión de Logs (10)
- **Universidad:** ESPOCH

---

## 📌 Resumen Ejecutivo

Este sistema implementa:
1. **Tablas espejo/históricas** con `old_value` vs `new_value`
2. **Triggers automáticos** en PostgreSQL
3. **Detección de ataques de fuerza bruta**
4. **Alertas en tiempo real** vía WebSocket
5. **Dashboard de seguridad** para administradores

---

## 🚀 Preparación antes de la Demostración

### 1. Ejecutar el script SQL (una sola vez)
```bash
# Conectar a PostgreSQL y ejecutar el script
psql -U postgres -d laboratorio_franz -f database/07_auditoria_seguridad_triggers.sql
```

### 2. Generar el cliente de Prisma
```bash
cd SistemaWebLaboratorio/Software/backend
npx prisma generate
```

### 3. Iniciar el servidor
```bash
npm run start:dev
```

---

## 📊 DEMOSTRACIÓN 1: Auditoría de Tablas (old_value vs new_value)

### Paso 1: Modificar un usuario desde la aplicación o directamente en BD

```sql
-- Ejemplo: Cambiar el nombre de un usuario
UPDATE usuarios.usuario
SET nombres = 'Juan Carlos Modificado'
WHERE codigo_usuario = 1;
```

### Paso 2: Consultar el historial de cambios

```sql
-- Ver qué cambió (old_value vs new_value)
SELECT
    codigo_auditoria,
    operacion,
    datos_anteriores->>'nombres' AS nombre_anterior,
    datos_nuevos->>'nombres' AS nombre_nuevo,
    fecha_operacion
FROM auditoria.auditoria_tabla
WHERE tabla = 'usuarios.usuario'
ORDER BY fecha_operacion DESC
LIMIT 5;
```

### Resultado esperado:
| codigo_auditoria | operacion | nombre_anterior | nombre_nuevo | fecha_operacion |
|------------------|-----------|-----------------|--------------|-----------------|
| 1 | UPDATE | Juan Carlos | Juan Carlos Modificado | 2025-12-04 10:30:00 |

### Pregunta que responde: "¿Quién modificó este dato y cuándo?"

---

## 🔐 DEMOSTRACIÓN 2: Detección de Fuerza Bruta

### Paso 1: Simular intentos de login fallidos

Usando curl o Postman, hacer múltiples intentos con contraseña incorrecta:

```bash
# Repetir este comando 6 veces con contraseña incorrecta
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin@test.com", "password": "contraseña_incorrecta"}'
```

### Paso 2: Verificar los logs de intentos

```sql
-- Ver intentos de login recientes
SELECT
    identificador,
    ip_address,
    exitoso,
    motivo_fallo,
    fecha_intento
FROM auditoria.log_intento_login
ORDER BY fecha_intento DESC
LIMIT 10;
```

### Paso 3: Ver la alerta generada

```sql
-- Ver alertas de seguridad
SELECT
    tipo_alerta,
    nivel,
    descripcion,
    ip_address,
    fecha_alerta
FROM auditoria.alerta_seguridad
WHERE resuelta = FALSE
ORDER BY fecha_alerta DESC;
```

### Resultado esperado:
| tipo_alerta | nivel | descripcion | ip_address |
|-------------|-------|-------------|------------|
| FUERZA_BRUTA | WARNING | Posible ataque de fuerza bruta: 5 intentos fallidos desde IP 127.0.0.1 | 127.0.0.1 |

---

## 📈 DEMOSTRACIÓN 3: Dashboard de Seguridad (API)

### Endpoint del Dashboard
```bash
# Requiere autenticación como administrador
curl -X GET http://localhost:3001/api/seguridad/dashboard \
  -H "Authorization: Bearer <tu_token_jwt>"
```

### Respuesta esperada:
```json
{
  "resumen": {
    "periodo": "Últimas 24 horas",
    "total_intentos_login": 15,
    "intentos_exitosos": 8,
    "intentos_fallidos": 7,
    "tasa_exito": "53.33%",
    "alertas_activas": 2,
    "alertas_criticas": 0
  },
  "top_ips_sospechosas": [
    { "ip": "192.168.1.100", "intentos_fallidos": 5 }
  ],
  "estado_sistema": {
    "estado": "ALERTA",
    "mensaje": "Se detectaron anomalías que requieren revisión",
    "recomendaciones": [
      "Alta tasa de intentos de login fallidos"
    ]
  }
}
```

---

## 🔔 DEMOSTRACIÓN 4: Alertas en Tiempo Real (WebSocket)

### Configurar cliente WebSocket (usando el frontend o herramienta como wscat)

```javascript
// Código de ejemplo para el frontend
const socket = io('http://localhost:3001/events', {
  auth: { token: 'tu_jwt_token' }
});

// Escuchar alertas de seguridad
socket.on('security:alert', (data) => {
  console.log('🚨 ALERTA:', data);
  // Mostrar notificación al admin
});

// Escuchar mensajes del sistema
socket.on('system:message', (data) => {
  if (data.type === 'error') {
    alert(data.message); // Alerta crítica
  }
});
```

### Flujo de la demostración:
1. Abrir la consola del navegador en el panel admin
2. Hacer intentos de login fallidos en otra pestaña
3. Ver cómo aparece la alerta en tiempo real

---

## 📁 DEMOSTRACIÓN 5: Vistas SQL Predefinidas

### Vista: Resumen de intentos por IP
```sql
SELECT * FROM auditoria.v_resumen_intentos_login;
```

| ip_address | total_intentos | intentos_exitosos | intentos_fallidos | identificadores_distintos |
|------------|----------------|-------------------|-------------------|---------------------------|
| 127.0.0.1 | 10 | 3 | 7 | 2 |
| 192.168.1.50 | 5 | 5 | 0 | 1 |

### Vista: Alertas activas ordenadas por criticidad
```sql
SELECT * FROM auditoria.v_alertas_activas;
```

### Vista: Historial de cambios en usuarios
```sql
SELECT * FROM auditoria.v_historial_cambios_usuarios;
```

---

## 🛡️ DEMOSTRACIÓN 6: Triggers Automáticos

### Explicar que los triggers se ejecutan SIEMPRE

```sql
-- Incluso si alguien accede directamente a la BD
-- El trigger captura el cambio automáticamente

-- Ejemplo: Cambiar precio de un examen
UPDATE catalogo.precio
SET precio = 25.00
WHERE codigo_precio = 1;

-- Verificar que se registró en auditoría
SELECT
    operacion,
    datos_anteriores->>'precio' AS precio_anterior,
    datos_nuevos->>'precio' AS precio_nuevo
FROM auditoria.auditoria_tabla
WHERE tabla = 'catalogo.precio'
ORDER BY fecha_operacion DESC
LIMIT 1;
```

### Tablas con triggers configurados:
- `usuarios.usuario` - Cambios en usuarios
- `usuarios.rol` - Cambios en roles
- `catalogo.examen` - Cambios en exámenes
- `catalogo.precio` - Cambios en precios (muy importante)
- `pagos.pago` - Cambios en pagos
- `resultados.resultado` - Cambios en resultados
- `inventario.movimiento` - Movimientos de inventario

---

## 📝 Preguntas Frecuentes para la Exposición

### P: ¿Por qué usar triggers en vez de solo logging en la aplicación?

**R:** Los triggers se ejecutan a nivel de base de datos, lo que significa que:
- Se ejecutan SIEMPRE, incluso si alguien accede directamente con pgAdmin
- No dependen de que la aplicación funcione correctamente
- Son más difíciles de evadir o desactivar
- Proporcionan una capa adicional de seguridad

### P: ¿Cómo se detecta un ataque de fuerza bruta?

**R:** El sistema cuenta los intentos fallidos de login desde una misma IP en una ventana de 15 minutos:
- 5 intentos → Alerta WARNING
- 10 intentos → Alerta CRITICAL
- Se notifica en tiempo real al administrador vía WebSocket

### P: ¿Qué significa old_value vs new_value?

**R:** Es el concepto de "tablas espejo" o "históricas":
- `old_value` (datos_anteriores): El estado del registro ANTES del cambio
- `new_value` (datos_nuevos): El estado del registro DESPUÉS del cambio
- Permite responder: "¿Qué valor tenía antes? ¿Quién lo cambió?"

### P: ¿Por qué esto es "del lado del servidor"?

**R:** Porque:
1. El cliente (navegador) puede ser manipulado por el usuario
2. Los logs en el servidor no pueden ser alterados por usuarios normales
3. Los triggers de PostgreSQL están protegidos por la BD
4. Los backups requieren acceso al sistema de archivos del servidor

---

## 🎯 Puntos Clave para la Presentación

1. **Trazabilidad completa**: Se puede rastrear quién hizo qué y cuándo
2. **Detección proactiva**: El sistema detecta ataques antes de que causen daño
3. **Alertas en tiempo real**: Los administradores son notificados inmediatamente
4. **Cumplimiento normativo**: Este tipo de auditoría es requerido por ISO 27001, HIPAA, etc.
5. **Defensa en profundidad**: Múltiples capas de seguridad (aplicación + BD + servidor)

---

## 📚 Referencias Teóricas

- **ISO 27001**: Control A.12.4 - Logging y monitoreo
- **OWASP**: Logging Cheat Sheet
- **PostgreSQL**: Documentación de triggers y funciones
- **Regla 3-2-1**: Estándar de la industria para backups

---

## ✅ Checklist de Verificación Pre-Demostración

- [ ] Script SQL ejecutado en la base de datos
- [ ] Prisma generate ejecutado
- [ ] Servidor backend corriendo
- [ ] Token JWT de administrador disponible
- [ ] Conexión a PostgreSQL verificada
- [ ] Frontend conectado para ver alertas WebSocket
