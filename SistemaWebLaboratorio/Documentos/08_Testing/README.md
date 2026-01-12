# Documentación de Testing

Esta carpeta contiene documentación sobre las pruebas del sistema.

## Estructura de Tests

### Backend (Jest)

Los tests unitarios del backend están ubicados junto a los archivos que prueban:

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `prisma.service.spec.ts` | `backend/src/prisma/` | Test del servicio Prisma |
| `auth.service.spec.ts` | `backend/src/modules/auth/services/` | Autenticación |
| `users.service.spec.ts` | `backend/src/modules/users/` | Gestión de usuarios |
| `agenda.service.spec.ts` | `backend/src/modules/agenda/` | Citas y slots |
| `chatbot.service.spec.ts` | `backend/src/modules/chatbot/services/` | Chatbot |
| `admin.service.spec.ts` | `backend/src/modules/admin/` | Dashboard admin |
| `admin-events.service.spec.ts` | `backend/src/modules/admin/` | Eventos admin |
| `cotizaciones.service.spec.ts` | `backend/src/modules/pagos/` | Cotizaciones |
| `pagos.service.spec.ts` | `backend/src/modules/pagos/` | Pagos |
| `resultados.service.spec.ts` | `backend/src/modules/resultados/` | Resultados |
| `inventario.service.movimientos.spec.ts` | `backend/src/modules/inventario/` | Movimientos inventario |
| `admin-events.listener.spec.ts` | `backend/src/modules/catalogo/listeners/` | Listener catálogo |
| `admin-events.listener.spec.ts` | `backend/src/modules/auditoria/listeners/` | Listener auditoría |

**Comandos:**
```bash
cd SistemaWebLaboratorio/Software/backend

# Ejecutar todos los tests
npm run test

# Ejecutar tests con cobertura
npm run test:cov

# Ejecutar tests E2E
npm run test:e2e
```

### Frontend (Playwright)

Los tests E2E del frontend están en `frontend/e2e/`:

| Archivo | Descripción |
|---------|-------------|
| `admin-core.spec.ts` | Funcionalidad básica del panel admin |
| `admin-agenda.spec.ts` | Gestión de citas y agenda |
| `admin-catalogo.spec.ts` | Catálogo de exámenes |
| `admin-operations.spec.ts` | Operaciones administrativas |
| `patient-journey.spec.ts` | Flujo completo del paciente |

**Comandos:**
```bash
cd SistemaWebLaboratorio/Software/frontend

# Ejecutar tests
npx playwright test

# Ejecutar con interfaz visual
npx playwright test --ui

# Ejecutar test específico
npx playwright test admin-core.spec.ts

# Ver reporte
npx playwright show-report
```

## Reportes

Los reportes de pruebas se generan en:
- **Backend:** `backend/coverage/` (cobertura de código)
- **Frontend:** `frontend/playwright-report/` (reportes HTML de Playwright)

Nota: Estos directorios están en `.gitignore` y deben regenerarse localmente.
