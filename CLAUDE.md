# 🤖 CLAUDE.md - AI Assistant Guide for Sistema Laboratorio Franz

> **Purpose**: This document provides comprehensive guidance for AI assistants working on the Sistema de Laboratorio Clínico Franz codebase. It outlines the architecture, conventions, workflows, and best practices to ensure consistent and high-quality contributions.

---

## 📚 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Repository Structure](#-repository-structure)
4. [Development Setup](#-development-setup)
5. [Architecture & Design Patterns](#-architecture--design-patterns)
6. [Database Schema](#-database-schema)
7. [API Conventions](#-api-conventions)
8. [Frontend Conventions](#-frontend-conventions)
9. [Code Style & Best Practices](#-code-style--best-practices)
10. [Testing Strategy](#-testing-strategy)
11. [Git Workflow](#-git-workflow)
12. [Common Tasks](#-common-tasks)
13. [Troubleshooting](#-troubleshooting)

---

## 🏥 Project Overview

**Sistema de Laboratorio Clínico Franz** is a comprehensive clinical laboratory management system built for managing:
- Patient appointments and scheduling
- Laboratory exam catalogs and pricing
- Quotations and payment processing
- Lab results with PDF generation
- Inventory management
- Real-time notifications via WebSockets
- Audit trails and activity logging

### Key Features
- **Multi-role System**: Admin, Personal Lab, Médico, Recepción, Paciente
- **Real-time Updates**: WebSocket integration for live notifications
- **PDF Generation**: Automated PDF generation for results and quotations
- **Multi-Schema Database**: 8 PostgreSQL schemas for logical separation
- **Event-Driven Architecture**: Comprehensive event emission for audit trails
- **Spanish Localization**: All UI text and validations in Spanish
- **Ecuador-specific**: Cédula validation for Ecuadorian IDs

### Project Locations
- **Repository Root**: `/home/user/SistemaLabG/`
- **Backend**: `/home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend/`
- **Frontend**: `/home/user/SistemaLabG/SistemaWebLaboratorio/Software/frontend/`
- **Database Scripts**: `/home/user/SistemaLabG/database/`

---

## 🛠️ Tech Stack

### Backend
```
Framework:      NestJS 10.4.18
Language:       TypeScript 5.7
Database:       PostgreSQL 14+ with Prisma ORM 6.2.0
Authentication: JWT with Passport (Local + JWT strategies)
Real-time:      Socket.io 4.8.1 + WebSockets
Job Queue:      BullMQ 5.30.7 + Redis (IORedis 5.4.2)
PDF:            PDFKit 0.15.0
Email:          Nodemailer 7.0.10
Validation:     class-validator + class-transformer
Security:       Helmet, BCrypt, CORS, Rate Limiting (Throttler)
Documentation:  Swagger/OpenAPI
Testing:        Jest + Supertest
```

### Frontend
```
Framework:      Next.js 14.1.0 (App Router)
Language:       TypeScript 5.3.3
UI Library:     React 18.2.0
Styling:        Tailwind CSS 3.4.1
Components:     Radix UI (Avatar, Dialog, Select, Tabs, Toast, Tooltip)
State:          Zustand 4.5.0 (with persist middleware)
Forms:          React Hook Form 7.49.3 + Zod 3.22.4
Icons:          Lucide React 0.315.0
Date Utils:     date-fns 3.2.0
Utils:          clsx, tailwind-merge, CVA (Class Variance Authority)
```

### Database
```
RDBMS:          PostgreSQL 14+
ORM:            Prisma 6.2.0
Schemas:        8 separate schemas (multi-schema support)
                - usuarios, agenda, catalogo, pagos
                - resultados, inventario, comunicaciones, auditoria
Models:         50+ Prisma models
```

---

## 📂 Repository Structure

```
/home/user/SistemaLabG/
├── README.md                               # Main project documentation
├── CLAUDE.md                               # This file - AI assistant guide
├── QUICK_START.md                          # Quick setup guide
├── INSTALACION_LOCAL.md                    # Detailed installation guide
├── CREDENCIALES_Y_PRUEBAS.md              # Test credentials and workflows
├── PANEL_ADMIN_IMPLEMENTADO.md            # Admin panel documentation
├── EVENT_EMISSION_ANALYSIS.md             # Event-driven architecture docs
├── ANALISIS_ESTADO_PROYECTO.md            # Project state analysis
│
├── database/                               # SQL migration scripts (legacy)
│   ├── 00_create_database.sql
│   ├── 01_create_schemas.sql
│   ├── 02_schema_usuarios.sql
│   ├── 03_schema_agenda.sql
│   ├── 04_schema_catalogo.sql
│   ├── 05_schema_pagos.sql
│   └── 06_schema_resultados_inventario_comunicaciones_auditoria.sql
│
└── SistemaWebLaboratorio/
    └── Software/
        ├── .claude/                        # Claude Code configuration
        │   └── settings.local.json
        │
        ├── backend/                        # NestJS Backend
        │   ├── src/
        │   │   ├── main.ts                 # Application bootstrap
        │   │   ├── app.module.ts           # Root module
        │   │   ├── prisma/                 # Prisma service
        │   │   │   ├── prisma.module.ts
        │   │   │   └── prisma.service.ts
        │   │   └── modules/                # Feature modules
        │   │       ├── auth/               # Authentication & authorization
        │   │       │   ├── controllers/
        │   │       │   ├── services/
        │   │       │   ├── strategies/     # Passport strategies
        │   │       │   ├── guards/         # JWT & Roles guards
        │   │       │   ├── decorators/     # @Public, @Roles, @CurrentUser
        │   │       │   └── dto/
        │   │       ├── admin/              # Admin CRUD operations
        │   │       ├── users/              # User management
        │   │       ├── agenda/             # Appointments & scheduling
        │   │       ├── catalogo/           # Exam catalog
        │   │       ├── pagos/              # Quotes, payments, invoicing
        │   │       ├── resultados/         # Lab results & PDFs
        │   │       ├── inventario/         # Inventory management
        │   │       ├── comunicaciones/     # Chat & notifications
        │   │       ├── auditoria/          # Activity & error logging
        │   │       └── events/             # WebSocket gateway
        │   ├── prisma/
        │   │   ├── schema.prisma           # Multi-schema database definition
        │   │   ├── seed.ts                 # Database seeding script
        │   │   └── seed.sql
        │   ├── test/                       # E2E tests
        │   ├── .env.example                # Environment variables template
        │   ├── tsconfig.json               # TypeScript configuration
        │   ├── nest-cli.json               # NestJS CLI configuration
        │   └── package.json                # Dependencies
        │
        └── frontend/                       # Next.js Frontend
            ├── app/                        # Next.js App Router
            │   ├── layout.tsx              # Root layout
            │   ├── page.tsx                # Root page (redirects)
            │   ├── globals.css             # Global styles + custom lab classes
            │   ├── admin/                  # Admin panel routes
            │   │   ├── layout.tsx          # Admin layout with sidebar
            │   │   ├── page.tsx            # Admin dashboard
            │   │   ├── usuarios/           # User management
            │   │   ├── roles/              # Role management
            │   │   ├── servicios/          # Services
            │   │   ├── sedes/              # Locations/Branches
            │   │   ├── examenes/           # Exams
            │   │   ├── paquetes/           # Packages
            │   │   ├── citas/              # Appointments
            │   │   ├── cotizaciones/       # Quotations
            │   │   ├── resultados/         # Results
            │   │   ├── inventario/         # Inventory
            │   │   ├── proveedores/        # Suppliers
            │   │   ├── auditoria/          # Audit logs
            │   │   ├── configuracion/      # Settings
            │   │   └── debug/              # Debug page
            │   ├── auth/                   # Authentication
            │   │   ├── login/              # Login page
            │   │   └── register/           # Registration page
            │   └── portal/                 # User portal (patients)
            │       ├── layout.tsx          # Portal layout with sidebar
            │       ├── page.tsx            # Dashboard
            │       ├── citas/              # Appointments
            │       ├── resultados/         # Results
            │       ├── cotizaciones/       # Quotations
            │       └── perfil/             # Profile
            ├── components/
            │   └── ui/                     # Reusable UI components
            │       ├── button.tsx          # Button with variants
            │       ├── card.tsx            # Card components
            │       ├── input.tsx           # Input field
            │       └── label.tsx           # Form label
            ├── lib/
            │   ├── api.ts                  # API client with all endpoints
            │   ├── store.ts                # Zustand auth store
            │   └── utils.ts                # Utility functions
            ├── .env.example                # Environment variables template
            ├── next.config.js              # Next.js configuration
            ├── tailwind.config.ts          # Tailwind CSS configuration
            ├── tsconfig.json               # TypeScript configuration
            └── package.json                # Dependencies
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ (recommended: 20 LTS)
- PostgreSQL 14+
- npm or yarn
- Git

### Initial Setup

#### 1. Database Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE laboratorio_franz;
CREATE USER lab_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE laboratorio_franz TO lab_user;
\q
```

#### 2. Backend Setup
```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://lab_user:your_password@localhost:5432/laboratorio_franz?schema=public"

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy

# Seed database with initial data
npm run prisma:seed

# Start development server
npm run start:dev
```

**Backend runs on**: `http://localhost:3000` (or PORT from .env)
**API Base**: `http://localhost:3000/api/v1`
**Swagger Docs**: `http://localhost:3000/api/docs`

#### 3. Frontend Setup
```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:3000` (Next.js default)

### Test Credentials
After running `npm run prisma:seed`, use these credentials:

**Admin**:
- Email: `admin@lab.com`
- Password: `admin123`
- Cédula: `1710034065`

**Patients** (for testing):
- Email: `maria.gonzalez@example.com` / Password: `Paciente123!`
- Email: `juan.morales@example.com` / Password: `Paciente123!`
- Email: `ana.rodriguez@example.com` / Password: `Paciente123!`

**Lab Personnel**:
- Email: `laboratorio@lab.com` / Password: `Personal123!`

**Receptionist**:
- Email: `recepcion@lab.com` / Password: `Recepcion123!`

---

## 🏗️ Architecture & Design Patterns

### Backend Architecture

#### 1. Module-Based Architecture (NestJS)
- **11 Feature Modules**: Each module encapsulates a domain (auth, users, agenda, etc.)
- **Layered Architecture**: Controller → Service → Prisma (Repository pattern)
- **Dependency Injection**: NestJS IoC container for loose coupling

#### 2. Multi-Schema Database Design
```
8 PostgreSQL Schemas:
├── usuarios       → Users, roles, sessions, medical profiles
├── agenda         → Appointments, schedules, services, locations
├── catalogo       → Exams, categories, packages, pricing
├── pagos          → Quotations, payments, invoicing
├── resultados     → Samples, results, verification, downloads
├── inventario     → Items, stock, batches, movements, suppliers
├── comunicaciones → Chat, messages, notifications
└── auditoria      → Activity logs, error logs
```

**Why Multi-Schema?**
- Logical separation of concerns
- Easier to manage permissions
- Better organization for large databases
- Simplified backup/restore strategies

#### 3. Event-Driven Architecture
- **NestJS EventEmitter**: Inter-module communication
- **WebSocket Gateway**: Real-time client notifications
- **Event Types**: `user.created`, `quote.generated`, `result.validated`, etc.
- **Audit Trail**: All events logged to `auditoria.log_actividad`

Example event flow:
```
Admin creates exam → catalogo.exam.created event
                  → auditoria listens → logs to log_actividad
                  → events gateway → broadcasts to connected clients
```

#### 4. Authentication & Authorization

**Authentication Flow**:
```
1. User login (POST /auth/login) with cedula/email + password
2. Backend validates credentials (LocalStrategy)
3. Generate access_token (15m) + refresh_token (7d)
4. Store refresh_token in database (Sesion table)
5. Return both tokens to client
6. Client stores tokens (Zustand + localStorage)
7. Client includes Bearer token in Authorization header
8. Backend validates JWT on protected routes (JwtAuthGuard)
```

**Authorization (Role-Based)**:
- **Roles**: Admin, Personal Lab, Médico, Recepción, Paciente
- **Level Access**: 1-5 (higher = more access)
- **Guards**: `@Roles('ADMIN', 'MEDICO')` decorator on routes
- **RolesGuard**: Validates user role matches required roles

**Guards** (`/modules/auth/guards/`):
- `JwtAuthGuard`: Validates JWT token (applied globally, use `@Public()` to skip)
- `RolesGuard`: Validates user roles (use `@Roles(...roles)` decorator)

**Decorators** (`/modules/auth/decorators/`):
- `@Public()`: Mark route as public (skip JWT validation)
- `@Roles(...roles)`: Require specific roles
- `@CurrentUser(property?)`: Extract current user from request

#### 5. DTOs (Data Transfer Objects)
- **Validation**: class-validator decorators
- **Transformation**: class-transformer for type conversion
- **Swagger**: Decorators for API documentation

Example DTO:
```typescript
export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Exam name' })
  nombre: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Price in USD' })
  precio: number;
}
```

### Frontend Architecture

#### 1. Next.js App Router
- **File-based Routing**: Each `page.tsx` becomes a route
- **Nested Layouts**: Separate layouts for `/admin`, `/portal`, `/auth`
- **Server Components**: Default (use 'use client' for client components)
- **Metadata API**: SEO-friendly metadata per route

#### 2. State Management (Zustand)
**Auth Store** (`/lib/store.ts`):
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user, accessToken, refreshToken) => void;
  updateAccessToken: (accessToken) => void;
  clearAuth: () => void;
}
```

**Persistence**: localStorage via `persist` middleware
**Usage**: `const { user, isAuthenticated } = useAuthStore()`

#### 3. API Client Pattern (`/lib/api.ts`)
- **Namespace Pattern**: `authApi`, `usersApi`, `appointmentsApi`, etc.
- **Generic Request Function**: `request<T>(endpoint, options)`
- **Auto Token Injection**: Reads from Zustand store
- **Error Handling**: Custom `ApiError` class

Example:
```typescript
// In /lib/api.ts
export const authApi = {
  login: (cedula: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula, password }),
    }),
};

// Usage in component
const handleLogin = async () => {
  const response = await authApi.login(cedula, password);
  setAuth(response.user, response.accessToken, response.refreshToken);
};
```

#### 4. Component Patterns
- **UI Components** (`/components/ui/`): Reusable, accessible primitives
- **CVA for Variants**: Class Variance Authority for type-safe variants
- **Radix UI**: Accessible unstyled components as base
- **Composition**: Small, composable components

Example:
```typescript
// Button with variants
<Button variant="destructive" size="lg">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

#### 5. Route Protection
```typescript
// In admin/layout.tsx or portal/layout.tsx
'use client';

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
    // Admin-only routes
    if (user?.rol !== 'ADMIN') {
      router.push('/portal');
    }
  }, [isAuthenticated, user]);

  return <>{children}</>;
}
```

---

## 🗄️ Database Schema

### Key Prisma Models (Simplified)

#### usuarios Schema
```prisma
model Usuario {
  codigo_usuario       Int
  cedula              String @unique
  nombres             String
  apellidos           String
  email               String @unique
  password_hash       String
  codigo_rol          Int
  rol                 Rol @relation(...)
  activo              Boolean @default(true)

  // Relations
  citas_como_paciente Cita[] @relation("CitasPaciente")
  cotizaciones        Cotizacion[]
  resultados_procesados Resultado[]

  @@schema("usuarios")
}

model Rol {
  codigo_rol     Int
  nombre         String @unique
  nivel_acceso   Int @default(1)
  usuarios       Usuario[]

  @@schema("usuarios")
}
```

#### catalogo Schema
```prisma
model Examen {
  codigo_examen      Int
  nombre             String
  codigo_categoria   Int
  precio             Decimal
  requiere_ayuno     Boolean
  tiempo_entrega_horas Int

  categoria          CategoriaExamen @relation(...)
  items_cotizacion   ItemCotizacion[]

  @@schema("catalogo")
}
```

#### pagos Schema
```prisma
model Cotizacion {
  codigo_cotizacion  Int
  codigo_usuario     Int
  fecha_cotizacion   DateTime
  total              Decimal
  estado             EstadoCotizacion // PENDIENTE, APROBADA, etc.

  usuario            Usuario @relation(...)
  items              ItemCotizacion[]
  pagos              Pago[]

  @@schema("pagos")
}
```

#### resultados Schema
```prisma
model Resultado {
  codigo_resultado   Int
  codigo_muestra     Int
  codigo_examen      Int
  valor_numerico     Decimal?
  valor_texto        String?
  nivel              NivelResultado // NORMAL, BAJO, ALTO, CRITICO
  validado           Boolean

  muestra            Muestra @relation(...)
  descargas          DescargaResultado[]

  @@schema("resultados")
}
```

### Important Database Conventions

1. **Primary Keys**: Always `codigo_<table_name>` (e.g., `codigo_usuario`, `codigo_examen`)
2. **Foreign Keys**: Always `codigo_<related_table>` (e.g., `codigo_rol`, `codigo_categoria`)
3. **Timestamps**: `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`
4. **Soft Deletes**: Use `activo: Boolean` flag, never hard delete
5. **User Tracking**: Include `usuario_creacion`, `usuario_modificacion` for audit
6. **Spanish Naming**: All table/column names in Spanish

### Prisma Commands
```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# Open Prisma Studio (GUI)
npm run prisma:studio  # http://localhost:5555

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

---

## 🔌 API Conventions

### API Structure
- **Base Path**: `/api/v1`
- **Versioning**: URI versioning (v1, v2, etc.)
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)

### Endpoint Naming
```
GET    /api/v1/catalogo/examenes           # List all exams
GET    /api/v1/catalogo/examenes/:id       # Get exam by ID
POST   /api/v1/catalogo/examenes           # Create exam
PUT    /api/v1/catalogo/examenes/:id       # Update exam
DELETE /api/v1/catalogo/examenes/:id       # Delete exam (soft)
```

### Response Format

**Success Response**:
```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "precio",
      "message": "precio must be a positive number"
    }
  ]
}
```

### Authentication Headers
```
Authorization: Bearer <access_token>
```

### Common HTTP Status Codes
- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Server error

### Pagination (if implemented)
```
GET /api/v1/users?page=1&limit=20

Response:
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 🎨 Frontend Conventions

### File Naming
- **Components**: PascalCase (e.g., `Button.tsx`, `UserCard.tsx`)
- **Pages**: lowercase (e.g., `page.tsx`, `layout.tsx`)
- **Utilities**: camelCase (e.g., `api.ts`, `utils.ts`, `store.ts`)

### Component Structure
```typescript
'use client'; // If client component

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

export default function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await onSubmit();
    setIsLoading(false);
  };

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Cargando...' : 'Enviar'}
      </Button>
    </div>
  );
}
```

### Styling Conventions

**Tailwind Classes**:
- Use Tailwind utility classes directly in JSX
- Use `cn()` utility to merge classes conditionally
- Custom classes in `globals.css` for reusable patterns

**Custom Color Palette** (from `tailwind.config.ts`):
```
lab-primary-*    → Medical blues (50-900)
lab-success-*    → Health greens (50-900)
lab-warning-*    → Alert oranges (50-900)
lab-danger-*     → Error reds (50-900)
lab-neutral-*    → UI grays (50-900)
```

Example:
```tsx
<div className="bg-lab-primary-900 text-white p-4">
  <Button className="bg-lab-success-600 hover:bg-lab-success-700">
    Guardar
  </Button>
</div>
```

### Form Handling (React Hook Form + Zod)
```typescript
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### Utility Functions (`/lib/utils.ts`)

**Available Utilities**:
- `cn(...classes)`: Merge Tailwind classes (clsx + tailwind-merge)
- `formatDate(date)`: Format date in Spanish locale
- `formatDateTime(date)`: Format date with time
- `formatCurrency(amount)`: Format as USD in Spanish locale
- `validateCedulaEcuador(cedula)`: Validate Ecuadorian ID
- `getInitials(name)`: Get initials for avatars
- `getGreeting()`: Time-based greeting (Buenos días/tardes/noches)
- `checkPasswordStrength(password)`: Password strength checker

---

## 📝 Code Style & Best Practices

### TypeScript
- **Strict Mode**: Always enabled
- **No `any`**: Use explicit types or `unknown`
- **Interfaces over Types**: For object shapes (preference)
- **Enums**: For fixed sets of values

```typescript
// Good
interface User {
  id: number;
  name: string;
  role: UserRole;
}

enum UserRole {
  ADMIN = 'ADMIN',
  PATIENT = 'PACIENTE',
}

// Avoid
const user: any = { ... };
```

### NestJS Backend

#### Controller Pattern
```typescript
@Controller('examenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamenesController {
  constructor(private readonly examenesService: ExamenesService) {}

  @Get()
  @Public() // Public endpoint
  @ApiOperation({ summary: 'Get all exams' })
  async findAll() {
    return this.examenesService.findAll();
  }

  @Post()
  @Roles('ADMIN') // Admin only
  @ApiOperation({ summary: 'Create exam' })
  async create(@Body() dto: CreateExamenDto) {
    return this.examenesService.create(dto);
  }
}
```

#### Service Pattern
```typescript
@Injectable()
export class ExamenesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateExamenDto) {
    const exam = await this.prisma.examen.create({
      data: {
        ...dto,
        fecha_creacion: new Date(),
      },
    });

    // Emit event for audit trail
    this.eventEmitter.emit('exam.created', { exam });

    return exam;
  }
}
```

#### Error Handling
```typescript
// Use NestJS built-in exceptions
throw new BadRequestException('Invalid data');
throw new NotFoundException('Exam not found');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');

// Custom error messages
throw new BadRequestException({
  message: 'Validation failed',
  errors: ['Field X is required', 'Field Y must be positive'],
});
```

### Next.js Frontend

#### Server vs Client Components
```typescript
// Server Component (default) - can fetch data, no hooks
export default async function Page() {
  const data = await fetch('...');
  return <div>{data.title}</div>;
}

// Client Component - can use hooks, interactivity
'use client';
export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### Data Fetching
```typescript
// Client-side fetching with API client
'use client';
import { examsApi } from '@/lib/api';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examsApi.getAll();
        setExams(data);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return <div>Cargando...</div>;
  return <div>{exams.map(exam => <div key={exam.id}>{exam.nombre}</div>)}</div>;
}
```

### Naming Conventions

#### Backend (Spanish)
- **Models**: Singular, Spanish (e.g., `Usuario`, `Examen`, `Cotizacion`)
- **Tables**: Lowercase, singular (e.g., `usuario`, `examen`, `cotizacion`)
- **Columns**: Lowercase, snake_case (e.g., `codigo_usuario`, `fecha_creacion`)
- **Services**: PascalCase + Service (e.g., `UsuariosService`, `ExamenesService`)
- **Controllers**: PascalCase + Controller (e.g., `UsuariosController`)
- **DTOs**: PascalCase + Dto (e.g., `CreateExamenDto`, `UpdateUsuarioDto`)

#### Frontend (Spanish UI, English Code)
- **Components**: PascalCase (e.g., `UserCard`, `ExamList`)
- **Files**: camelCase (e.g., `api.ts`, `utils.ts`)
- **Variables**: camelCase (e.g., `isLoading`, `userName`)
- **UI Text**: Spanish (e.g., "Guardar", "Cancelar", "Cargando...")

### Comments & Documentation

#### When to Comment
- **Complex Logic**: Explain "why", not "what"
- **Business Rules**: Document business logic
- **API Contracts**: JSDoc for public APIs
- **TODOs**: Mark incomplete/future work

```typescript
// Good: Explains WHY
// Calculate checksum using Ecuador's cédula algorithm (modulo 10)
const checksum = calculateEcuadorChecksum(cedula);

// Bad: Explains obvious WHAT
// Loop through users
for (const user of users) { ... }
```

#### JSDoc for Public APIs
```typescript
/**
 * Validates Ecuadorian cédula (ID) using official algorithm.
 *
 * @param cedula - 10-digit Ecuadorian ID
 * @returns true if valid, false otherwise
 *
 * @example
 * validateCedulaEcuador('1710034065') // true
 * validateCedulaEcuador('1234567890') // false
 */
export function validateCedulaEcuador(cedula: string): boolean {
  // Implementation...
}
```

---

## 🧪 Testing Strategy

### Backend Testing (Jest)

#### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov
```

**Test File Naming**: `*.spec.ts` (e.g., `examenes.service.spec.ts`)

**Example Unit Test**:
```typescript
describe('ExamenesService', () => {
  let service: ExamenesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExamenesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ExamenesService>(ExamenesService);
  });

  it('should create an exam', async () => {
    const dto = { nombre: 'Hemograma', precio: 15.00 };
    const result = await service.create(dto);
    expect(result.nombre).toBe('Hemograma');
  });
});
```

#### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in watch mode
npm run test:e2e:watch
```

**Test File Naming**: `*.e2e-spec.ts` (in `/test` folder)

### Frontend Testing
Currently no testing framework configured. Consider adding:
- **Jest** + **React Testing Library** for unit/integration tests
- **Playwright** or **Cypress** for E2E tests

---

## 🔀 Git Workflow

### Branch Naming
```
feature/add-inventory-module
fix/appointment-validation-bug
refactor/user-service-cleanup
docs/update-readme
```

### Commit Messages (Conventional Commits)
```
feat(catalogo): add exam category filtering
fix(auth): resolve token refresh issue
docs(readme): update installation steps
refactor(users): simplify user creation logic
test(pagos): add unit tests for payment service
```

**Format**: `<type>(<scope>): <description>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Pull Request Process
1. Create feature branch from `main`
2. Make changes and commit frequently
3. Push branch to remote
4. Create pull request with descriptive title and description
5. Wait for review/approval
6. Merge into `main`

### Important Git Commands
```bash
# Check current branch
git branch

# Create and switch to new branch
git checkout -b feature/my-feature

# Stage changes
git add .

# Commit with message
git commit -m "feat(module): add new feature"

# Push to remote
git push origin feature/my-feature

# Pull latest changes from main
git checkout main
git pull origin main

# Merge main into feature branch
git checkout feature/my-feature
git merge main
```

---

## 🛠️ Common Tasks

### Add a New Backend Module

1. **Generate Module**:
```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend
nest generate module modules/my-module
nest generate controller modules/my-module
nest generate service modules/my-module
```

2. **Create DTOs** (`/modules/my-module/dto/`):
```typescript
// create-my-entity.dto.ts
export class CreateMyEntityDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

3. **Implement Service**:
```typescript
@Injectable()
export class MyModuleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMyEntityDto) {
    return this.prisma.myEntity.create({ data: dto });
  }
}
```

4. **Implement Controller**:
```typescript
@Controller('my-module')
@UseGuards(JwtAuthGuard)
export class MyModuleController {
  constructor(private service: MyModuleService) {}

  @Post()
  create(@Body() dto: CreateMyEntityDto) {
    return this.service.create(dto);
  }
}
```

5. **Add to App Module** (`src/app.module.ts`):
```typescript
@Module({
  imports: [
    // ...
    MyModuleModule,
  ],
})
export class AppModule {}
```

### Add a New Frontend Page

1. **Create Route Folder**:
```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/frontend
mkdir -p app/admin/my-page
```

2. **Create Page** (`app/admin/my-page/page.tsx`):
```typescript
'use client';

export default function MyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Page</h1>
      <p>Content here...</p>
    </div>
  );
}
```

3. **Add to Admin Sidebar** (`app/admin/layout.tsx`):
```typescript
const menuItems = [
  // ...
  {
    name: 'My Page',
    href: '/admin/my-page',
    icon: FileText, // From lucide-react
  },
];
```

### Add a New Prisma Model

1. **Edit Schema** (`prisma/schema.prisma`):
```prisma
model MyEntity {
  id          Int      @id @default(autoincrement())
  name        String
  created_at  DateTime @default(now())

  @@map("my_entity")
  @@schema("my_schema")
}
```

2. **Generate Migration**:
```bash
npm run prisma:migrate
# Enter migration name: "add_my_entity_table"
```

3. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

4. **Use in Service**:
```typescript
const entity = await this.prisma.myEntity.create({
  data: { name: 'Test' },
});
```

### Add Event Emission (for Audit Trail)

1. **In Service**:
```typescript
constructor(
  private prisma: PrismaService,
  private eventEmitter: EventEmitter2,
) {}

async create(dto: CreateExamenDto) {
  const exam = await this.prisma.examen.create({ data: dto });

  // Emit event
  this.eventEmitter.emit('exam.created', {
    codigo_usuario: currentUser.codigo_usuario,
    exam,
  });

  return exam;
}
```

2. **Listen in Auditoria Module**:
```typescript
@OnEvent('exam.created')
async handleExamCreated(payload: any) {
  await this.prisma.logActividad.create({
    data: {
      codigo_usuario: payload.codigo_usuario,
      accion: 'CREAR_EXAMEN',
      detalles: `Examen ${payload.exam.nombre} creado`,
    },
  });
}
```

---

## 🐛 Troubleshooting

### Backend Issues

#### "Prisma Client not found"
```bash
npm run prisma:generate
```

#### "Cannot connect to database"
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify `DATABASE_URL` in `.env`
- Test connection: `psql -U lab_user -d laboratorio_franz`

#### "Port 3000 already in use"
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill -9`

#### "Migration failed"
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually fix migration
npx prisma migrate resolve --applied <migration_name>
```

### Frontend Issues

#### "API calls return undefined"
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Restart Next.js dev server
- Verify backend is running

#### "Authentication not persisting"
- Check browser localStorage (DevTools → Application → Local Storage)
- Verify Zustand store is configured with `persist`
- Clear localStorage and re-login

#### "Module not found"
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check import paths use `@/` alias

### Database Issues

#### "Schema 'usuarios' does not exist"
- Run migrations: `npx prisma migrate deploy`
- Or manually create schemas (see `database/` folder SQL scripts)

#### "Too many open connections"
- Check Prisma connection pooling
- Reduce `connection_limit` in `DATABASE_URL`

#### "Seed script fails"
- Check data already exists (unique constraints)
- Reset database: `npx prisma migrate reset`
- Run seed: `npm run prisma:seed`

---

## 📚 Additional Resources

### Documentation Files (in repo root)
- `README.md` - Project overview
- `QUICK_START.md` - Fast setup guide
- `INSTALACION_LOCAL.md` - Detailed installation
- `CREDENCIALES_Y_PRUEBAS.md` - Test credentials
- `PANEL_ADMIN_IMPLEMENTADO.md` - Admin panel features
- `EVENT_EMISSION_ANALYSIS.md` - Event-driven architecture

### External Documentation
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs)

### Useful Commands Reference

#### Backend
```bash
npm run start:dev          # Start dev server with watch
npm run build              # Build for production
npm run start:prod         # Start production server
npm run lint               # Lint code
npm run format             # Format code with Prettier
npm test                   # Run unit tests
npm run test:e2e           # Run E2E tests
npm run prisma:studio      # Open Prisma Studio GUI
```

#### Frontend
```bash
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Lint code
npm run type-check         # TypeScript type checking
```

---

## 🎯 AI Assistant Guidelines

When working on this codebase as an AI assistant, follow these principles:

### 1. **Understand Before Changing**
- Always read existing code before making changes
- Check related files to understand context
- Review documentation files for business logic

### 2. **Maintain Consistency**
- Follow existing patterns (don't introduce new patterns without discussion)
- Use Spanish for database/UI, English for code
- Match indentation and formatting of existing code

### 3. **Preserve Functionality**
- Don't break existing features
- Test changes before committing
- Consider edge cases and error handling

### 4. **Security First**
- Never expose sensitive data (passwords, tokens, secrets)
- Always validate user input
- Use parameterized queries (Prisma handles this)
- Sanitize data before displaying

### 5. **Event-Driven Mindset**
- Emit events for important actions (create, update, delete)
- Listen to events in auditoria module for logging
- Broadcast to WebSocket for real-time updates

### 6. **Type Safety**
- Use TypeScript types everywhere
- Leverage Prisma generated types
- Avoid `any` type

### 7. **Error Handling**
- Use try-catch blocks
- Provide meaningful error messages (in Spanish for user-facing)
- Log errors appropriately

### 8. **Documentation**
- Update CLAUDE.md if you add new patterns
- Add comments for complex logic
- Update Swagger docs for API changes

### 9. **Ask When Uncertain**
- Don't assume business logic
- Clarify requirements before implementing
- Suggest alternatives when appropriate

---

## ✅ Checklist for Common Changes

### Adding a New Feature
- [ ] Update Prisma schema if needed
- [ ] Create/update DTOs with validation
- [ ] Implement service methods
- [ ] Implement controller endpoints
- [ ] Add guards/decorators for auth
- [ ] Emit events for audit trail
- [ ] Add Swagger documentation
- [ ] Create frontend API client methods
- [ ] Implement UI components
- [ ] Add to navigation menu
- [ ] Test all flows
- [ ] Update documentation

### Fixing a Bug
- [ ] Reproduce the bug
- [ ] Identify root cause
- [ ] Write test to cover bug
- [ ] Implement fix
- [ ] Verify test passes
- [ ] Test related functionality
- [ ] Update documentation if needed

### Refactoring Code
- [ ] Ensure tests exist
- [ ] Run tests before changes
- [ ] Make incremental changes
- [ ] Run tests after each change
- [ ] Verify no functionality broken
- [ ] Update documentation if patterns changed

---

**Last Updated**: 2025-11-18
**Maintainer**: AI Assistant (Claude)
**Version**: 1.0.0

---

For questions or clarification, refer to the documentation files in the repository or consult with the development team.
