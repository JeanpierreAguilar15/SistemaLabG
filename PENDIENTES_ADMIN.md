# 📋 PENDIENTES - PANEL ADMINISTRADOR

**Fecha**: 2025-11-19
**Basado en**: Historias de Usuario V3

---

## ✅ YA IMPLEMENTADO (Completado)

| # | Historia | Página Admin | Estado |
|---|----------|--------------|--------|
| HU-07 | Gestión de Usuarios y Roles | `/admin/usuarios`, `/admin/roles` | ✅ 100% |
| HU-17 | Gestión de Exámenes | `/admin/examenes` | ✅ 100% |
| - | Gestión de Servicios | `/admin/servicios` | ✅ 100% |
| - | Gestión de Sedes | `/admin/sedes` | ✅ 100% |
| - | Gestión de Paquetes | `/admin/paquetes` | ✅ 100% |
| HU-28 | Inventario - Crear Items | `/admin/inventario` | ✅ 80% (CRUD básico) |
| - | Gestión de Proveedores | `/admin/proveedores` | ✅ 100% |
| HU-12 | Cotizaciones - Ver | `/admin/cotizaciones` | ✅ 70% (solo lectura) |
| HU-20 | Gestión de Resultados | `/admin/resultados` | ✅ 90% (crear, validar, PDF) |
| HU-10 | Cupos y Horarios | `/admin/citas` | ✅ 80% (crear slots) |
| - | Configuración del Sistema | `/admin/configuracion` | ✅ 100% |
| - | Auditoría | `/admin/auditoria` | ✅ 50% (solo lectura) |

**Total implementado**: ~12 de 30 historias (~40%)

---

## 🔴 PRIORIDAD CRÍTICA (Valor 9-10, Prioridad 1)

### 1. **HU-14: Gestión de Precios y Servicios**
- **Valor**: 8 | **Estimación**: 8h | **Prioridad**: 1
- **Página**: `/admin/precios` (nueva)
- **Funcionalidades**:
  - [ ] Establecer precios base por examen/servicio
  - [ ] Actualizar precios masivamente
  - [ ] Aplicar descuentos y promociones
  - [ ] Configurar tarifas especiales
  - [ ] Precios por paquetes/combos
  - [ ] Generar reportes de precios y márgenes
  - [ ] Historial de cambios de precios
- **Impacto**: CRÍTICO - Los exámenes no tienen gestión de precios unificada
- **Dependencias**: HU-02 (BD), HU-08 (permisos)

---

### 2. **HU-22: Seguimiento y Gestión de Pagos**
- **Valor**: 10 | **Estimación**: 20h | **Prioridad**: 1
- **Página**: `/admin/pagos` (nueva)
- **Funcionalidades**:
  - [ ] Consultar estado de pagos en tiempo real
  - [ ] Visualizar historial completo con filtros
  - [ ] Procesar devoluciones con motivo
  - [ ] Anular pagos pendientes
  - [ ] Conciliar con pasarela de pago
  - [ ] Ver comprobantes de pago
  - [ ] Reportes de ingresos por período
  - [ ] Dashboard de métricas de pago
- **Impacto**: CRÍTICO - Sin esto no hay control financiero
- **Dependencias**: HU-14 (precios), HS-13 (pasarela)

---

### 3. **HU-28-34: Sistema Completo de Inventario**
- **Valor**: 10 | **Estimación**: 48h total | **Prioridad**: 1
- **Página**: `/admin/inventario` (mejorar existente)

#### 3.1 **HU-29: Consultar y Filtrar Inventario** (20h)
  - [ ] Visualizar listado completo con paginación
  - [ ] Filtros por categoría, estado, proveedor
  - [ ] Búsqueda por código/nombre
  - [ ] Ver lotes y fechas de caducidad
  - [ ] Exportar a Excel/PDF
  - [ ] Vista de kardex por ítem

#### 3.2 **HU-30: Editar Items con Trazabilidad** (14h)
  - [ ] Modificar información de ítems
  - [ ] Bitácora completa de cambios
  - [ ] Quién modificó y cuándo
  - [ ] Restricciones de edición según stock
  - [ ] Validar cambios críticos

#### 3.3 **HU-31: Movimientos de Stock** (28h) ⚠️ MÁS IMPORTANTE
  - [ ] Registrar ENTRADAS de stock
    - Por compra
    - Por devolución
    - Por ajuste de inventario
  - [ ] Registrar SALIDAS de stock
    - Por uso en exámenes
    - Por merma
    - Por venta
  - [ ] Sistema Kardex (PEPS/Promedio Ponderado)
  - [ ] Cálculo automático de costo unitario
  - [ ] Historial completo de movimientos
  - [ ] Conciliación de saldos
  - [ ] Validación de stock negativo

#### 3.4 **HU-32: Órdenes de Compra** (22h)
  - [ ] Crear órdenes de compra
  - [ ] Vincular a proveedor
  - [ ] Estados: Borrador → Emitida → Recibida
  - [ ] Generar PDF de orden
  - [ ] Recepción de mercancía (genera entrada stock)
  - [ ] Historial de compras por proveedor
  - [ ] Precios históricos

#### 3.5 **HU-33: Alertas de Stock** (14h)
  - [ ] Notificaciones de stock bajo
  - [ ] Alertas de productos próximos a vencer
  - [ ] Dashboard de alertas
  - [ ] Configurar umbrales por ítem
  - [ ] Email automático a responsables
  - [ ] Sugerencias automáticas de reorden

#### 3.6 **HU-34: Reportes de Inventario** (14h)
  - [ ] Reporte de movimientos por período
  - [ ] Valorización de inventario
  - [ ] Análisis ABC de productos
  - [ ] Rotación de inventario
  - [ ] Productos sin movimiento
  - [ ] Exportar a PDF/Excel

**Total Inventario**: ~112 horas de desarrollo

---

## 🟡 PRIORIDAD ALTA (Valor 7-8)

### 4. **HU-11: Mejoras en Gestión de Citas**
- **Valor**: 8 | **Estimación**: 6h | **Prioridad**: 2
- **Página**: `/admin/citas` (mejorar existente)
- **Funcionalidades faltantes**:
  - [ ] Reprogramar citas existentes
  - [ ] Cancelar con motivo específico
  - [ ] Políticas de anticipación (mín 24h)
  - [ ] Notificaciones automáticas SMS/Email
  - [ ] Historial de cambios por cita
  - [ ] Reportes de cancelaciones
  - [ ] Estadísticas de no-show

---

### 5. **Reportes y Dashboard Administrativo**
- **Valor**: 9 | **Estimación**: 12h | **Prioridad**: Nueva
- **Página**: `/admin/dashboard` y `/admin/reportes`
- **Funcionalidades**:
  - [ ] **Dashboard Principal**:
    - Gráficos de citas (diarias/semanales)
    - Ingresos vs egresos
    - Top exámenes solicitados
    - Ocupación de slots
    - Alertas críticas
  - [ ] **Reportes**:
    - Reporte de ocupación por servicio/fecha
    - Análisis de ingresos por período
    - Exámenes más/menos solicitados
    - Eficiencia de personal
    - Tiempo promedio de entrega resultados
    - Exportar todos a PDF/Excel

---

### 6. **HU-17: Completar Gestión de Exámenes**
- **Valor**: 9 | **Estimación**: 4h | **Prioridad**: 1
- **Página**: `/admin/examenes` (mejorar)
- **Funcionalidades faltantes**:
  - [ ] Definir requisitos de preparación detallados
  - [ ] Indicaciones según edad/condiciones
  - [ ] Categorizar por tipo (bioquímica, hematología, etc.)
  - [ ] Instrucciones de preparación personalizadas
  - [ ] Recordatorios automáticos

---

## 🟢 PRIORIDAD MEDIA (Valor 4-6)

### 7. **Mejoras en Cotizaciones**
- **Página**: `/admin/cotizaciones` (mejorar)
- **Funcionalidades**:
  - [ ] Aprobar/rechazar cotizaciones
  - [ ] Aplicar descuentos manuales
  - [ ] Convertir a factura
  - [ ] Enviar por email
  - [ ] Estados: Pendiente → Aprobada → Pagada

---

### 8. **Mejoras en Resultados**
- **Página**: `/admin/resultados` (mejorar)
- **Funcionalidades**:
  - [ ] Firma digital del médico
  - [ ] Configurar plantillas personalizables
  - [ ] Múltiples resultados en un PDF
  - [ ] Comparativas históricas
  - [ ] Estados más granulares

---

### 9. **Mejoras en Auditoría**
- **Página**: `/admin/auditoria` (mejorar)
- **Funcionalidades**:
  - [ ] Filtros avanzados (fecha, usuario, acción)
  - [ ] Búsqueda de eventos específicos
  - [ ] Exportar logs
  - [ ] Gráficos de actividad
  - [ ] Alertas de eventos sospechosos

---

## 📊 RESUMEN DE PRIORIDADES

| Prioridad | Items | Horas Est. | Impacto |
|-----------|-------|------------|---------|
| 🔴 **CRÍTICA** | 3 módulos | ~176h | Sistema incompleto sin estos |
| 🟡 **ALTA** | 4 módulos | ~28h | Mejoran significativamente UX |
| 🟢 **MEDIA** | 3 módulos | ~12h | Nice to have |
| **TOTAL** | **10 módulos** | **~216h** | **5-6 semanas** |

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### **Sprint 1 (Semana 1-2): Inventario Completo** ⚠️ MÁS IMPORTANTE
**Justificación**: El inventario es crítico para operación del laboratorio

1. **Semana 1** (40h):
   - ✅ HU-31: Movimientos de Stock (28h) - CRÍTICO
   - ✅ HU-33: Alertas de Stock (12h)

2. **Semana 2** (40h):
   - ✅ HU-29: Consultar Inventario (20h)
   - ✅ HU-30: Editar con Trazabilidad (14h)
   - ✅ HU-32: Órdenes de Compra - Parte 1 (6h)

3. **Semana 3** (40h):
   - ✅ HU-32: Órdenes de Compra - Parte 2 (16h)
   - ✅ HU-34: Reportes de Inventario (14h)
   - ✅ Testing y ajustes (10h)

---

### **Sprint 2 (Semana 4): Precios y Pagos**
4. **Semana 4** (40h):
   - ✅ HU-14: Gestión de Precios (8h)
   - ✅ HU-22: Seguimiento de Pagos (20h)
   - ✅ HU-11: Mejoras en Citas (6h)
   - ✅ Testing (6h)

---

### **Sprint 3 (Semana 5): Dashboard y Reportes**
5. **Semana 5** (40h):
   - ✅ Dashboard Administrativo (12h)
   - ✅ Reportes Avanzados (12h)
   - ✅ Mejoras en Exámenes (4h)
   - ✅ Mejoras en Cotizaciones (4h)
   - ✅ Mejoras en Resultados (4h)
   - ✅ Mejoras en Auditoría (4h)

---

## 🚀 SIGUIENTES PASOS INMEDIATOS

### **OPCIÓN A: Empezar con INVENTARIO COMPLETO** (Recomendado)
**Razón**: Es el módulo más grande y crítico, sin él el laboratorio no puede operar correctamente

**Primera tarea**: HU-31 - Movimientos de Stock
- Entradas de inventario
- Salidas de inventario
- Sistema Kardex
- Esto desbloquea el resto del inventario

---

### **OPCIÓN B: Empezar con PRECIOS Y PAGOS**
**Razón**: Sin gestión de precios y pagos, el sistema no genera ingresos

**Primera tarea**: HU-14 - Gestión de Precios
- Establecer precios base
- Luego: HU-22 - Seguimiento de Pagos

---

### **OPCIÓN C: Completar módulos existentes primero**
**Razón**: Pulir lo que ya existe antes de agregar más

**Primera tarea**: Mejoras en Citas, Cotizaciones, Resultados

---

## ❓ PREGUNTA PARA EL USUARIO

**¿Con cuál módulo quieres que empecemos?**

1. 🏪 **INVENTARIO COMPLETO** (Movimientos de Stock) - 3 semanas
2. 💰 **PRECIOS Y PAGOS** (Control financiero) - 1 semana
3. 📊 **DASHBOARD Y REPORTES** (Visualización) - 1 semana
4. 🔧 **PULIR EXISTENTES** (Mejorar citas, cotizaciones, resultados) - 1 semana

**Recomendación**: Opción 1 (Inventario) porque es el más grande y desbloquea operaciones críticas.
