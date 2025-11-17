# 🏥 Sistema de Laboratorio Clínico Franz

Sistema completo de gestión para laboratorio clínico desarrollado con Next.js, NestJS, PostgreSQL y Prisma.

## 📋 Características Principales

### Portal del Paciente ✅
- ✅ Registro y autenticación con JWT
- ✅ Dashboard intuitivo con estadísticas
- ✅ Gestión de citas médicas
- ✅ Visualización y descarga de resultados
- ✅ Solicitud de cotizaciones
- ✅ Gestión de perfil personal

### Panel Administrativo 🔄
- 🔄 Gestión de roles configurables
- 🔄 Gestión de usuarios
- 🔄 Control de inventario
- 🔄 Reportes y estadísticas
- 🔄 Configuración de horarios dinámicos

## 🎨 Diseño

- **Paleta de Colores**: Azules médicos profesionales, verdes de salud
- **Responsive**: Totalmente adaptable (móviles, tablets, escritorio)
- **UI/UX**: Interfaz moderna, intuitiva y fácil de usar
- **Componentes**: Basados en Radix UI y Tailwind CSS

## 🛠️ Stack Tecnológico

### Frontend
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Radix UI
- Zustand (estado global)
- Zod + react-hook-form

### Backend
- NestJS 10 + TypeScript
- PostgreSQL 14+ + Prisma ORM
- JWT + Passport (autenticación)
- Swagger/OpenAPI
- class-validator

## 📦 Instalación Rápida

### 1. Base de Datos

```bash
cd database
psql -U postgres -f 00_create_database.sql
psql -U postgres -d Lab_Bd -f 01_create_schemas.sql
psql -U postgres -d Lab_Bd -f 02_schema_usuarios.sql
psql -U postgres -d Lab_Bd -f 03_schema_agenda.sql
psql -U postgres -d Lab_Bd -f 04_schema_catalogo.sql
psql -U postgres -d Lab_Bd -f 05_schema_pagos.sql
psql -U postgres -d Lab_Bd -f 06_schema_resultados_inventario_comunicaciones_auditoria.sql
```

### 2. Backend

```bash
cd SistemaWebLaboratorio/Software/backend
npm install
npm run prisma:generate
npm run prisma:seed    # Crea admin y datos iniciales
npm run start:dev      # http://localhost:3105
```

**Admin:** `admin@lab.com` / `admin123` (cédula: `1710034065`)

### 3. Frontend

```bash
cd SistemaWebLaboratorio/Software/frontend
npm install
npm run dev  # http://localhost:3000
```

## 🚀 URLs del Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3105/api/v1
- **Swagger Docs**: http://localhost:3105/api/docs

## 📱 Características Dinámicas

- ✅ **Actualización en Tiempo Real**: Cambios del admin se reflejan inmediatamente
- ✅ **Roles Configurables**: Crear y editar roles desde el panel admin
- ✅ **Horarios Dinámicos**: Actualización automática de disponibilidad de citas
- ✅ **Validaciones Específicas**: Cédula y teléfonos ecuatorianos

## 🎨 Paleta de Colores

- **Azul Principal**: `#2563EB` (Profesional médico)
- **Verde Éxito**: `#22C55E` (Salud y bienestar)
- **Naranja Advertencia**: `#F97316` (Alertas)
- **Rojo Peligro**: `#EF4444` (Errores/Urgente)

## 📖 Documentación Completa

Ver [documentación detallada](./docs/) para:
- Arquitectura del sistema
- API endpoints completos
- Guías de desarrollo
- Testing

---

© 2025 Laboratorio Clínico Franz
