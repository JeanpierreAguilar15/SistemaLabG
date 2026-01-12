# Plan de Implementación - Sistema de Reservas Centro Deportivo

## Resumen del Proyecto
Sistema web para reservar canchas deportivas (fútbol, tenis, básquet), gestionar horarios, realizar pagos y recibir notificaciones.

---

## Tech Stack (basado en sistema laboratorio)
| Capa | Tecnología |
|------|------------|
| Backend | NestJS + TypeScript + Prisma |
| Frontend | Next.js 14 + Tailwind CSS |
| Base de datos | PostgreSQL |
| Autenticación | JWT + Passport |
| Pagos | Integración básica |
| Notificaciones | Nodemailer |

---

## Fases de Implementación

### **FASE 1: Estructura Base** (Día 1-2)
- [ ] Inicializar proyecto NestJS (backend)
- [ ] Inicializar proyecto Next.js (frontend)
- [ ] Configurar Prisma + PostgreSQL
- [ ] Configurar variables de entorno

**Entregable:** Proyecto corriendo en localhost

---

### **FASE 2: Modelo de Datos** (Día 2-3)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │────▶│   Reserva   │◀────│   Cancha    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│    Pago     │
                    └─────────────┘
```

**Tablas:**
1. `Usuario` - id, nombre, email, password, telefono, rol
2. `Cancha` - id, nombre, tipo (futbol/tenis/basquet), precio_hora, activa
3. `Horario` - id, cancha_id, dia_semana, hora_inicio, hora_fin
4. `Reserva` - id, usuario_id, cancha_id, fecha, hora_inicio, hora_fin, estado
5. `Pago` - id, reserva_id, monto, metodo, estado, fecha

---

### **FASE 3: Módulo Usuarios** (Día 3-4)
- [ ] Registro de usuario
- [ ] Login con JWT
- [ ] Perfil de usuario
- [ ] Roles (admin/cliente)

**Pruebas unitarias:** Clase Usuario, validaciones

---

### **FASE 4: Módulo Canchas** (Día 4-5)
- [ ] CRUD de canchas (admin)
- [ ] Listar canchas disponibles
- [ ] Ver detalle de cancha
- [ ] Gestionar horarios

**Pruebas unitarias:** Clase Cancha, disponibilidad

---

### **FASE 5: Módulo Reservas** (Día 5-7)
- [ ] Ver disponibilidad por fecha/hora
- [ ] Crear reserva
- [ ] Cancelar reserva
- [ ] Historial de reservas

**Pruebas de integración:** Flujo registro → reserva → pago

---

### **FASE 6: Módulo Pagos** (Día 7-8)
- [ ] Procesar pago de reserva
- [ ] Generar comprobante
- [ ] Historial de pagos

**Pruebas de integración:** Reserva → Pago → Confirmación

---

### **FASE 7: Notificaciones** (Día 8-9)
- [ ] Email de confirmación de registro
- [ ] Email de confirmación de reserva
- [ ] Email de recordatorio (24h antes)

---

### **FASE 8: Frontend** (Día 9-12)
- [ ] Página de inicio
- [ ] Registro/Login
- [ ] Catálogo de canchas
- [ ] Calendario de disponibilidad
- [ ] Formulario de reserva
- [ ] Proceso de pago
- [ ] Dashboard usuario (mis reservas)
- [ ] Panel admin

---

### **FASE 9: Pruebas** (Día 12-14)
| Tipo | Descripción | Herramienta |
|------|-------------|-------------|
| Unitarias | Clases Usuario, Reserva, Pago | Jest |
| Integración | Flujo completo registro→reserva→pago | Jest + Supertest |
| Sistema | Funcionalidades desde UI | Playwright |
| Aceptación | Casos de uso del cliente | Manual + Playwright |
| Rendimiento | Múltiples usuarios simultáneos | Artillery/k6 |
| Seguridad | SQL injection, XSS, auth | Manual + OWASP ZAP |

---

### **FASE 10: Documentación** (Día 14-15)
- [ ] Plan de pruebas con matriz de cobertura
- [ ] Capturas de evidencias
- [ ] Informe final con análisis

---

## Estructura de Carpetas
```
ProyectoFinal/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── canchas/
│   │   │   ├── reservas/
│   │   │   ├── pagos/
│   │   │   └── notificaciones/
│   │   ├── prisma/
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── test/
├── frontend/
│   ├── app/
│   │   ├── auth/
│   │   ├── canchas/
│   │   ├── reservas/
│   │   ├── pagos/
│   │   └── admin/
│   └── components/
├── docs/
│   ├── plan-pruebas.md
│   ├── evidencias/
│   └── informe-final.md
└── PLAN_IMPLEMENTACION.md
```

---

## Criterios de Evaluación (100 pts)
| Criterio | Puntos | Cómo cumplir |
|----------|--------|--------------|
| Diseño del sistema | 20 | Clases bien definidas, OOP, relaciones claras |
| Implementación funcional | 20 | Todos los casos de uso funcionando |
| Cobertura de pruebas | 25 | 6 tipos de pruebas documentadas |
| Documentación | 15 | Plan + evidencias + informe |
| Calidad del código | 10 | TypeScript, commits claros, código limpio |
| Presentación | 10 | Demo funcional + responder preguntas |

---

## Siguiente Paso
¿Por cuál fase quieres comenzar? Recomiendo empezar por **FASE 1** para tener la estructura base lista.
