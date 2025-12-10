# CLAUDE.md - Sistema Laboratorio Clinico Franz

This document provides guidance for AI assistants working with the Sistema Laboratorio Clinico Franz codebase.

## Project Overview

**Sistema Laboratorio Clinico Franz** is a comprehensive web-based laboratory management system for clinical laboratories. The system handles patient appointments, exam catalogs, quotations, payments, lab results, inventory management, and communications including a Dialogflow-integrated chatbot.

## Repository Structure

```
SistemaLabG/
├── SistemaWebLaboratorio/
│   ├── Software/
│   │   ├── backend/          # NestJS API server
│   │   ├── frontend/         # Next.js web application
│   │   └── database/         # SQL seed scripts
│   └── Documentos/           # Project documentation
│       ├── 01_Alcance/
│       ├── 02_CasosDeUso/
│       ├── 03_HistoriasDeUsuario/
│       ├── 04_Requerimientos/
│       ├── 05_Tecnologias/
│       └── 06_Arquitectura/
└── package-lock.json
```

## Tech Stack

### Backend (`SistemaWebLaboratorio/Software/backend/`)

- **Framework**: NestJS 10.x with TypeScript 5.x
- **Database**: PostgreSQL 14+ with multi-schema architecture
- **ORM**: Prisma 6.x with `multiSchema` preview feature
- **Authentication**: JWT with Passport (local + JWT strategies)
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI at `/api/docs`
- **Security**: Helmet, CORS, Rate Limiting (Throttler)
- **Real-time**: Socket.io for WebSockets
- **Queue**: BullMQ with Redis (ioredis)
- **File Storage**: AWS S3 (@aws-sdk/client-s3)
- **Email**: Nodemailer
- **PDF Generation**: PDFKit
- **Chatbot**: Google Dialogflow integration
- **Scheduling**: @nestjs/schedule for cron jobs
- **Events**: @nestjs/event-emitter for domain events

### Frontend (`SistemaWebLaboratorio/Software/frontend/`)

- **Framework**: Next.js 14.x (App Router)
- **Language**: TypeScript 5.x
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand 4.x with persist middleware
- **Forms**: React Hook Form with Zod validation
- **Real-time**: Socket.io-client
- **Date handling**: date-fns
- **Icons**: Lucide React
- **E2E Testing**: Playwright

## Database Architecture

The database uses PostgreSQL with 8 separate schemas:

| Schema | Purpose |
|--------|---------|
| `usuarios` | User accounts, roles, sessions, consents, medical profiles |
| `agenda` | Appointments, slots, schedules, services, locations, holidays |
| `catalogo` | Exam catalog, categories, pricing, packages |
| `pagos` | Quotations, payments, invoices |
| `resultados` | Lab samples, results, downloads |
| `inventario` | Items, lots, stock movements, suppliers, purchase orders |
| `comunicaciones` | Conversations, messages, notifications |
| `auditoria` | Activity logs, error logs, security alerts, chatbot logs |

### Key Models

- **Usuario** - Central user entity with role-based access
- **Cita** - Appointments linked to slots and patients
- **Examen** - Lab exams with pricing and reference values
- **Cotizacion** - Quotations with exam details
- **Resultado** - Lab results with validation workflow
- **Item/Lote/Movimiento** - Inventory with FIFO lot tracking

## Development Commands

### Backend

```bash
cd SistemaWebLaboratorio/Software/backend

# Install dependencies
npm install

# Generate Prisma client (required after schema changes)
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server (port 3001)
npm run start:dev

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

### Frontend

```bash
cd SistemaWebLaboratorio/Software/frontend

# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run lint
npm run lint
```

### E2E Tests (Frontend)

```bash
# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui
```

## API Structure

The backend API runs at `http://localhost:3001` with prefix `/api/v1`.

### Main Modules

| Module | Path | Description |
|--------|------|-------------|
| auth | `/auth` | Login, register, JWT refresh, password recovery |
| users | `/users` | User profile management |
| agenda | `/appointments` | Slots and appointment management |
| catalogo | `/catalog` | Exams, categories, pricing, packages |
| pagos | `/quotations`, `/payments` | Quotes and payment processing |
| resultados | `/resultados` | Lab results and sample management |
| inventario | `/inventory` | Stock, lots, suppliers, purchase orders |
| comunicaciones | `/chat` | Live chat, notifications |
| auditoria | `/audit` | Activity and error logs |
| admin | `/admin` | Admin dashboard data |
| system-config | `/system-config` | System configuration |
| feriados | `/feriados` | Holiday management |
| reports | `/reports` | Report generation |
| dialogflow-webhook | `/dialogflow-webhook` | Chatbot webhook |

## Frontend Structure

### App Routes

- `/` - Landing/redirect
- `/auth/login`, `/auth/register` - Authentication
- `/portal/*` - Patient portal
  - `/portal/citas` - My appointments
  - `/portal/cotizaciones` - My quotations
  - `/portal/resultados` - My results
  - `/portal/perfil` - My profile
- `/admin/*` - Admin dashboard (requires ADMIN/LABORATORISTA role)
  - `/admin/usuarios` - User management
  - `/admin/citas` - Appointment management
  - `/admin/examenes` - Exam catalog
  - `/admin/paquetes` - Exam packages
  - `/admin/precios` - Price management
  - `/admin/cotizaciones` - Quotation management
  - `/admin/pagos` - Payment processing
  - `/admin/resultados` - Results management
  - `/admin/inventario` - Inventory management
  - `/admin/movimientos` - Stock movements
  - `/admin/proveedores` - Suppliers
  - `/admin/ordenes-compra` - Purchase orders
  - `/admin/sedes` - Locations
  - `/admin/servicios` - Services
  - `/admin/feriados` - Holidays
  - `/admin/chatbot` - Chatbot config
  - `/admin/livechat` - Live chat dashboard
  - `/admin/auditoria` - Audit logs
  - `/admin/seguridad` - Security alerts
  - `/admin/configuracion` - System config
  - `/admin/reportes` - Reports
  - `/admin/alertas` - Stock alerts

### Key Frontend Patterns

1. **State Management**: Use `useAuthStore` from `lib/store.ts` for auth state
2. **API Calls**: Use typed API functions from `lib/api.ts`
3. **UI Components**: Prefer Radix UI components in `components/ui/`
4. **Styling**: Use Tailwind CSS classes with `cn()` utility from `lib/utils.ts`
5. **Forms**: Use React Hook Form with Zod schemas for validation

## Code Conventions

### Backend

- Use NestJS decorators and dependency injection
- DTOs for request/response validation with class-validator
- Services contain business logic, controllers handle HTTP
- Use EventEmitter for cross-module communication
- Prisma for all database operations
- Path aliases: `@/*`, `@config/*`, `@modules/*`, `@common/*`, `@prisma/*`

### Frontend

- Use App Router conventions (page.tsx, layout.tsx)
- Server Components by default, 'use client' when needed
- Path alias: `@/*` for root imports
- Spanish language for user-facing text
- TypeScript strict mode enabled

### Database

- Primary keys: `codigo_*` prefix (e.g., `codigo_usuario`)
- Foreign keys follow same pattern
- Use `activo` boolean for soft deletes
- Timestamps: `fecha_creacion`, `fecha_actualizacion`
- Spanish column names throughout

### Naming Conventions

- **Backend modules**: Spanish names (usuarios, agenda, catalogo, pagos, resultados, inventario, comunicaciones, auditoria)
- **API endpoints**: English paths for REST conventions
- **Database**: Spanish table and column names
- **Frontend components**: PascalCase, English names
- **Variables/functions**: camelCase

## Testing

### Backend Tests

- Unit tests: `*.spec.ts` files alongside source
- E2E tests: `test/` directory
- Use Jest with ts-jest
- Mock Prisma service for unit tests

### Frontend Tests

- E2E tests with Playwright in `e2e/` directory
- Test files: `*.spec.ts`
- Main test suites:
  - `admin-core.spec.ts` - Admin dashboard basics
  - `admin-agenda.spec.ts` - Appointment management
  - `admin-catalogo.spec.ts` - Exam catalog
  - `admin-operations.spec.ts` - Administrative operations
  - `patient-journey.spec.ts` - Patient workflow

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/laboratorio_franz_db

# JWT
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
API_PREFIX=api/v1

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Twilio WhatsApp (for notifications)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
WHATSAPP_DEFAULT_RECIPIENT=
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Important Notes for AI Assistants

1. **Language**: The codebase uses Spanish for:
   - Database schema (table/column names)
   - User-facing text in frontend
   - Module names in backend
   - Documentation

2. **Multi-schema Database**: Always specify the schema in Prisma operations. The `@@schema()` directive is required for all models.

3. **Authentication Flow**:
   - JWT access tokens (short-lived, 15min default)
   - Refresh tokens (long-lived, 7 days default)
   - Role-based access: PACIENTE, LABORATORISTA, ADMIN

4. **Result Workflow**: Results follow a state machine:
   - EN_PROCESO -> COMPLETADO -> VALIDADO -> ENTREGADO

5. **Inventory Management**: Uses FIFO lot tracking with:
   - Stock alerts when below minimum
   - WhatsApp notifications for critical alerts

6. **Real-time Features**:
   - Socket.io for live chat
   - Event emitter for internal events

7. **Swagger Documentation**: Available at `http://localhost:3001/api/docs` when backend is running

8. **Type Safety**: Both backend and frontend use TypeScript with strict configurations

9. **Validation**:
   - Backend: class-validator decorators
   - Frontend: Zod schemas with React Hook Form

10. **Chatbot Integration**: Uses Google Dialogflow with custom webhook handlers for domain-specific intents
