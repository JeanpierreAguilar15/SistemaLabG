monolito modular (frontend + backend)

- frontend/: next.js app router con typescript, tailwind-like clases y componentes accesibles.
- backend/: nestjs modular (auth, users/profile, appointments, results, billing, audit).
- database/: migraciones sql. la inicial ya existe (usa tu esquema actual).

notas
- mantener datos clínicos sensibles protegidos y auditar accesos.
- endpoints devuelven json; validación con dtos.
- frontend usa server components por defecto; subcomponentes interactivos como client.
