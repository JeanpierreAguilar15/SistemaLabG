# Guía de Pruebas - Sprints 7, 8 y 9

## Sistema Laboratorio Clínico Franz

Esta guía cubre las pruebas para validar las funcionalidades implementadas en los sprints 7, 8 y 9.

---

## Requisitos Previos

```bash
# Backend (Puerto 3001)
cd SistemaWebLaboratorio/Software/backend
npm run start:dev

# Frontend (Puerto 3000)
cd SistemaWebLaboratorio/Software/frontend
npm run dev
```

**Credenciales de Prueba:**
- Admin: `admin@laboratoriofranz.com` / `Admin123!`
- Paciente: (crear uno nuevo para pruebas)

---

## SPRINT 7 - Inventario Base y Tiempo Real

### 1. HS-24-S2: Chat en Tiempo Real - Handoff a Humano

**Ruta:** `/admin/livechat`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Abrir chat como paciente en otra ventana | Chat conecta via WebSocket | |
| 2 | Enviar mensaje desde paciente | Mensaje aparece en panel admin | |
| 3 | Responder desde admin | Paciente recibe respuesta en tiempo real | |
| 4 | Verificar indicador de conexión | Muestra usuarios conectados | |
| 5 | Cerrar chat del paciente | Admin ve desconexión | |

**Endpoints a verificar:**
```
WebSocket: ws://localhost:3001
GET /chat/conversations
POST /chat/messages
```

---

### 2. HU-28-S2 + HU-30: Ítems de Inventario (CRUD + Trazabilidad)

**Ruta:** `/admin/inventario`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Ir a Inventario > Items | Lista de items cargada | |
| 2 | Click "Nuevo Item" | Modal de creación abierto | |
| 3 | Ingresar: Código (auto-sugerido), Nombre, Categoría, Stock mínimo | Formulario válido | |
| 4 | Guardar item | Item creado con código único | |
| 5 | Buscar item por código | Filtro funciona correctamente | |
| 6 | Editar item existente | Modal de edición con datos actuales | |
| 7 | Cambiar stock mínimo | Actualización exitosa | |
| 8 | Verificar auditoría | Cambios registrados en logs | |
| 9 | Intentar código duplicado | Error de validación | |
| 10 | Desactivar item | Item marcado como inactivo | |

**Endpoints a verificar:**
```
GET    /admin/inventory/items
GET    /admin/inventory/items/sugerir-codigo
POST   /admin/inventory/items
PUT    /admin/inventory/items/:id
DELETE /admin/inventory/items/:id
```

**SQL para verificar auditoría:**
```sql
SELECT * FROM auditoria.log_actividad
WHERE entidad = 'Item'
ORDER BY fecha_hora DESC LIMIT 10;
```

---

### 3. HU-29-S1: Consultar Inventario - Lista y Filtros

**Ruta:** `/admin/inventario`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Cargar lista de items | Paginación funcionando | |
| 2 | Filtrar por categoría | Solo items de esa categoría | |
| 3 | Filtrar por stock bajo | Items con stock < mínimo | |
| 4 | Buscar por nombre | Búsqueda en tiempo real | |
| 5 | Ordenar por stock | Ordenamiento ascendente/descendente | |
| 6 | Combinar filtros | Múltiples filtros aplicados | |

---

### 4. HU-32-S1: Proveedores (ABM Parcial)

**Ruta:** `/admin/proveedores`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Ir a Proveedores | Lista de proveedores | |
| 2 | Crear nuevo proveedor | Formulario con: RUC, Nombre, Contacto, Email, Teléfono | |
| 3 | Validar RUC ecuatoriano | Formato 13 dígitos validado | |
| 4 | Guardar proveedor | Creación exitosa | |
| 5 | Editar proveedor | Datos actualizados | |
| 6 | Buscar por nombre/RUC | Filtro funcionando | |
| 7 | Desactivar proveedor | Soft delete aplicado | |

**Endpoints:**
```
GET    /admin/suppliers
POST   /admin/suppliers
PUT    /admin/suppliers/:id
DELETE /admin/suppliers/:id
```

---

## SPRINT 8 - Lotes, Bot y Reportes Iniciales

### 5. HS-24-S3: Limpieza Automática de Conexiones

**Verificación técnica:**

| # | Verificación | Resultado Esperado | ✅ |
|---|-------------|-------------------|---|
| 1 | Abrir múltiples tabs de chat | Conexiones registradas | |
| 2 | Cerrar tabs abruptamente | Conexiones limpiadas después de timeout | |
| 3 | Revisar logs del servidor | No memory leaks reportados | |
| 4 | Verificar sesiones activas | Solo sesiones válidas en BD | |

**Comando para verificar:**
```bash
# Ver conexiones WebSocket activas
curl http://localhost:3001/api/v1/chat/stats
```

---

### 6. HU-26-S1: Bot de Turnos - Consulta y Pre-agendamiento

**Ruta:** Widget de chat / Dialogflow

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Escribir "quiero agendar una cita" | Bot responde con opciones de servicio | |
| 2 | Seleccionar servicio | Bot muestra fechas disponibles | |
| 3 | Elegir fecha | Bot muestra horarios disponibles | |
| 4 | Seleccionar horario | Bot confirma pre-reserva | |
| 5 | Pedir "ver mis citas" | Bot muestra citas del usuario | |
| 6 | Preguntar horarios | Bot informa horarios de atención | |

**Intents de Dialogflow a probar:**
- `agendar.cita`
- `consultar.citas`
- `consultar.horarios`
- `consultar.servicios`

---

### 7. HU-29-S2: Inventario - Lotes y Caducidad

**Ruta:** `/admin/inventario/lotes`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Ir a Lotes | Lista de lotes con fechas | |
| 2 | Crear lote nuevo | Formulario: Item, Cantidad, Fecha vencimiento, Proveedor | |
| 3 | Ingresar fecha vencimiento pasada | Warning de validación | |
| 4 | Guardar lote | Lote creado con número único | |
| 5 | Ver lotes por vencer (30 días) | Filtro de caducidad próxima | |
| 6 | Ver lotes vencidos | Lista de lotes expirados | |
| 7 | Exportar a Excel | Descarga archivo .xlsx | |

**Endpoints:**
```
GET  /admin/inventory/lotes
GET  /admin/inventory/lotes?vencimiento=proximo
POST /admin/inventory/lotes
GET  /admin/inventory/lotes/export
```

---

### 8. HU-32-S1 (resto): Órdenes de Compra en Borrador

**Ruta:** `/admin/ordenes-compra`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Ir a Órdenes de Compra | Lista de órdenes | |
| 2 | Crear nueva orden | Formulario: Proveedor, Items, Cantidades | |
| 3 | Agregar múltiples items | Líneas de detalle agregadas | |
| 4 | Calcular subtotales | Totales calculados automáticamente | |
| 5 | Guardar como borrador | Estado: BORRADOR | |
| 6 | Editar orden borrador | Modificación permitida | |
| 7 | Eliminar orden borrador | Eliminación exitosa | |

**Estados de OC:**
- `BORRADOR` → `EMITIDA` → `RECIBIDA`
- `BORRADOR` → `CANCELADA`

---

### 9. HS-19-S1: Reportes Automáticos - Config Inicial

**Ruta:** `/admin/reportes`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Ir a Reportes | Dashboard con KPIs | |
| 2 | Ver reporte de Resultados | Estadísticas de resultados entregados | |
| 3 | Filtrar por rango de fechas | Datos filtrados correctamente | |
| 4 | Exportar a PDF | Descarga PDF generado | |
| 5 | Ver gráfico de tendencias | Visualización correcta | |

**Endpoints:**
```
GET /reports/dashboard
GET /reports/resultados?fecha_desde=X&fecha_hasta=Y
GET /reports/resultados/pdf
```

---

## SPRINT 9 - Bot Completo, Auditoría y OC

### 10. HU-26-S2: Bot de Turnos - Confirmación y Handoff

**Ruta:** Widget de chat

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Pre-agendar cita via bot | Cita en estado pre-reservada | |
| 2 | Bot solicita confirmación | Mensaje de confirmación enviado | |
| 3 | Confirmar cita | Estado cambia a PENDIENTE | |
| 4 | Escribir "hablar con humano" | Bot transfiere a agente | |
| 5 | Agente recibe conversación | Chat transferido con contexto | |
| 6 | Agente responde | Paciente recibe respuesta humana | |

**Verificar en BD:**
```sql
SELECT * FROM comunicaciones.conversacion
WHERE handoff_solicitado = true;
```

---

### 11. HU-27: Auditoría del Bot - Panel y Métricas

**Ruta:** `/admin/chatbot`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Ir a Panel Chatbot | Dashboard de métricas | |
| 2 | Ver conversaciones totales | Contador actualizado | |
| 3 | Ver tasa de resolución | % de consultas resueltas sin humano | |
| 4 | Ver intents más usados | Ranking de intenciones | |
| 5 | Filtrar por fechas | Métricas del período | |
| 6 | Ver conversaciones fallidas | Lista de no-match | |
| 7 | Exportar métricas | Descarga CSV/PDF | |

**Endpoints:**
```
GET /admin/chatbot/metrics
GET /admin/chatbot/conversations
GET /admin/chatbot/intents/ranking
```

---

### 12. HS-19-S2: Reportes Automáticos - Cierre

**Ruta:** `/admin/reportes`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Generar reporte de ventas | Datos de pagos incluidos | |
| 2 | Generar reporte de exámenes | Ranking de exámenes populares | |
| 3 | Generar reporte de citas | Estados y conversiones | |
| 4 | Generar Kardex completo | Movimientos de inventario | |
| 5 | Programar reporte automático | Configuración guardada | |
| 6 | Verificar envío por email | Email recibido con PDF adjunto | |

**Endpoints:**
```
GET /reports/ventas
GET /reports/examenes
GET /reports/citas
GET /reports/kardex
POST /reports/schedule
```

---

### 13. HU-32-S2: Órdenes de Compra - Emisión y Totales

**Ruta:** `/admin/ordenes-compra`

| # | Paso | Resultado Esperado | ✅ |
|---|------|-------------------|---|
| 1 | Seleccionar orden en borrador | Detalles de la orden | |
| 2 | Click "Emitir Orden" | Confirmación requerida | |
| 3 | Confirmar emisión | Estado: EMITIDA, Fecha emisión registrada | |
| 4 | Intentar editar orden emitida | Edición bloqueada | |
| 5 | Ver totales con IVA | Cálculo: Subtotal + IVA = Total | |
| 6 | Recibir orden | Modal de recepción | |
| 7 | Ingresar cantidades recibidas | Validación de cantidades | |
| 8 | Confirmar recepción | Estado: RECIBIDA, Stock actualizado | |
| 9 | Verificar movimientos | Kardex registra entrada | |

**Endpoints:**
```
POST /admin/purchase-orders/:id/emit
POST /admin/purchase-orders/:id/receive
GET  /admin/purchase-orders/:id/totals
```

---

### 14. HS-36-S1: Refactor y Limpieza

**Verificación de calidad de código:**

| # | Verificación | Comando | ✅ |
|---|-------------|---------|---|
| 1 | Sin errores de TypeScript | `npm run build` | |
| 2 | Tests unitarios pasan | `npm run test` | |
| 3 | Tests E2E pasan | `npm run test:e2e` | |
| 4 | Sin warnings de ESLint | `npm run lint` | |
| 5 | Documentación Swagger actualizada | Visitar `/api/docs` | |

---

## Flujo Completo de Prueba End-to-End

### Escenario: Paciente agenda cita y recibe resultados

```
1. PACIENTE: Se registra en el sistema
   → POST /auth/register

2. PACIENTE: Inicia chat con bot
   → "Quiero agendar una cita para hemograma"

3. BOT: Ofrece fechas disponibles
   → Dialogflow intent: agendar.cita

4. PACIENTE: Selecciona fecha y hora
   → Bot crea pre-reserva

5. PACIENTE: Confirma cita
   → POST /agenda/citas (con cotización)

6. ADMIN: Revisa citas del día
   → GET /agenda/admin/citas

7. ADMIN: Toma muestra y completa cita
   → PUT /agenda/admin/citas/:id {estado: 'COMPLETADA'}

8. SISTEMA: Descuenta insumos del inventario
   → Movimientos de salida automáticos

9. ADMIN: Sube PDF de resultado
   → POST /resultados/:id/upload-pdf

10. SISTEMA: Notifica al paciente via email
    → Email con link de descarga

11. PACIENTE: Descarga resultado
    → GET /resultados/mis-resultados/:id/descargar

12. ADMIN: Verifica métricas
    → GET /reports/dashboard
```

---

## Checklist Final de Validación

| Módulo | Estado | Notas |
|--------|--------|-------|
| Chat Tiempo Real | | |
| Inventario Items | | |
| Inventario Lotes | | |
| Proveedores | | |
| Órdenes de Compra | | |
| Bot Dialogflow | | |
| Auditoría Bot | | |
| Reportes | | |
| Seguridad (@Roles) | | |

---

## Notas de Debugging

### Logs del Backend
```bash
# Ver logs en tiempo real
tail -f logs/application.log

# Buscar errores específicos
grep -i "error" logs/application.log
```

### Verificar WebSockets
```javascript
// En consola del navegador
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Verificar Base de Datos
```sql
-- Verificar estados de resultados
SELECT estado, COUNT(*) FROM resultados.resultado GROUP BY estado;

-- Verificar stock de inventario
SELECT i.nombre, l.cantidad_actual, l.fecha_vencimiento
FROM inventario.item i
JOIN inventario.lote l ON i.codigo_item = l.codigo_item
WHERE l.activo = true;
```

---

**Documento generado:** 2025-12-16
**Versión:** 1.0
