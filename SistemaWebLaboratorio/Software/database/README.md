base de datos (postgres)

requisitos
- postgres en localhost:5432, usuario postgres, contraseña admin1234.

pasos
1) crear estructura ejecutando el archivo sql raíz del repo `Esquema_Lab.sql` en la base `postgres` (o tu base preferida):
   psql "postgres://postgres:admin1234@localhost:5432/postgres" -f "../../Esquema_Lab.sql"
2) aplicar migraciones incrementales (agenda y catálogo):
   psql "postgres://postgres:admin1234@localhost:5432/postgres" -f "./migrations/003_agenda.sql"
   psql "postgres://postgres:admin1234@localhost:5432/postgres" -f "./migrations/004_catalog.sql"
   psql "postgres://postgres:admin1234@localhost:5432/postgres" -f "./migrations/005_catalog_add_categoria.sql"
   psql "postgres://postgres:admin1234@localhost:5432/postgres" -f "./migrations/006_quotes.sql"
   psql "postgres://postgres:admin1234@localhost:5432/postgres" -f "./migrations/007_agenda_sede_feriados.sql"
   (esto crea la tabla `catalogo.servicio` necesaria para cotizaciones)
3) seed de roles y admin opcional:
   cd ../backend
   cp .env .env.local (si quieres personalizar)
   set ADMIN_CEDULA=0000000000 && set ADMIN_EMAIL=admin@example.com && set ADMIN_PASSWORD=Admin1234 && npm run seed

nota
- el backend usa DATABASE_URL por defecto a postgres://postgres:admin1234@localhost:5432/postgres.
- asegúrate que tu servidor postgres permita conexiones locales.
