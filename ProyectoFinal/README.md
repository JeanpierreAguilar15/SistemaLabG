# Sistema de Reservas - Centro Deportivo

Sistema web para reservar canchas deportivas (fútbol, tenis, básquet), gestionar horarios, realizar pagos y recibir notificaciones.

## Arquitectura

**Monolito Modular** - Un solo proyecto organizado por módulos independientes.

```
ProyectoFinal/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── modules/  # Módulos del dominio
│   │   │   ├── auth/
│   │   │   ├── usuarios/
│   │   │   ├── canchas/
│   │   │   ├── reservas/
│   │   │   ├── pagos/
│   │   │   └── notificaciones/
│   │   └── prisma/   # Servicio de base de datos
│   └── prisma/       # Schema y migraciones
├── frontend/         # Next.js 14
│   ├── app/          # App Router
│   ├── components/   # Componentes React
│   └── lib/          # Utilidades
└── docs/             # Documentación
```

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Backend | NestJS 10 + TypeScript |
| Frontend | Next.js 14 + React 18 |
| Base de datos | PostgreSQL + Prisma |
| Estilos | Tailwind CSS |
| Autenticación | JWT + Passport |

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Instalación

### 1. Base de datos

```bash
# Crear base de datos PostgreSQL
createdb centro_deportivo
```

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Cargar datos de prueba
npm run prisma:seed

# Iniciar servidor de desarrollo
npm run start:dev
```

El backend estará en: http://localhost:3001
Documentación API: http://localhost:3001/api/docs

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará en: http://localhost:3000

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@centrodeportivo.com | admin123 |
| Cliente | cliente@test.com | cliente123 |

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/v1/usuarios/perfil` - Obtener perfil
- `PATCH /api/v1/usuarios/perfil` - Actualizar perfil

### Canchas
- `GET /api/v1/canchas` - Listar canchas
- `GET /api/v1/canchas/:id` - Detalle de cancha
- `GET /api/v1/canchas/:id/disponibilidad?fecha=YYYY-MM-DD` - Ver disponibilidad

### Reservas
- `POST /api/v1/reservas` - Crear reserva
- `GET /api/v1/reservas/mis-reservas` - Mis reservas
- `PATCH /api/v1/reservas/:id/cancelar` - Cancelar reserva

### Pagos
- `POST /api/v1/pagos` - Procesar pago
- `GET /api/v1/pagos/mis-pagos` - Historial de pagos

## Scripts Disponibles

### Backend
```bash
npm run start:dev     # Desarrollo con hot reload
npm run build         # Build producción
npm run test          # Ejecutar tests
npm run test:cov      # Tests con cobertura
npm run prisma:studio # GUI de base de datos
```

### Frontend
```bash
npm run dev           # Desarrollo
npm run build         # Build producción
npm run lint          # Linter
```

## Modelo de Datos

```
Usuario ──▶ Reserva ◀── Cancha
               │
               ▼
             Pago
```

## Autor

Proyecto Final - Sistema de Reservas para Centro Deportivo
