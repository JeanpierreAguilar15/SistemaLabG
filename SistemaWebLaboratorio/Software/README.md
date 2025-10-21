# SistemaWeb_Lab

Proyecto académico para un sistema web de laboratorio clínico.

Este repositorio se organiza como monolito modular con separación por capas:
- apps/api (NestJS + TypeScript)
- apps/web (Next.js + React)
- docs (arquitectura y decisiones)
- infrastructure (Docker compose y envs – opcional, posterior)

Para Sprint 1, se documenta la arquitectura, se crea la estructura de carpetas y se deja lista la base para implementar autenticación y conexión a BD.

## Estructura

- apps/
  - api/
    - src/
      - modules/ (módulos de dominio)
      - common/ (guards, filtros, dtos comunes)
      - config/ (configuración y constantes)
  - web/
    - src/
      - pages/ (rutas Next.js)
      - components/
      - lib/
- docs/
  - arquitectura.md
  - adr/
- infrastructure/
  - docker-compose.yml (opcional en Sprint 1)
  - .env.example

## Próximos pasos (Sprint 1)
- Implementar conexión a PostgreSQL (TypeORM) y autenticación JWT.
- Añadir página de login en `apps/web` que consuma `/auth/login`.

## Ejecutar backend (API)
- Variables: copia `.env.example` a `.env` (raíz o `apps/api/.env`).
- Crear BD y cargar `database/schema_mvp.sql` + `database/seed_dev.sql`.
- `cd apps/api && npm install && npm run start:dev` (http://localhost:3000).

## Ejecutar frontend (Web)
- Configura `apps/web/.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3000`.
- `cd apps/web && npm install && npm run dev` (http://localhost:3001).
