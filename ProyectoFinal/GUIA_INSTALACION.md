# Guía de Instalación - Sistema de Reservas Centro Deportivo

## Requisitos Previos

- **Node.js** 18 o superior
- **PostgreSQL** 14 o superior
- **npm** o **yarn**

---

## Paso 1: Instalar PostgreSQL

### Windows
1. Descargar de: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Recordar la contraseña del usuario `postgres`
4. Puerto por defecto: `5432`

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Mac
```bash
brew install postgresql@14
brew services start postgresql@14
```

---

## Paso 2: Crear la Base de Datos

### Opción A: Usando psql (terminal)
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE centro_deportivo;

# Verificar que se creó
\l

# Salir
\q
```

### Opción B: Usando pgAdmin (interfaz gráfica)
1. Abrir pgAdmin
2. Click derecho en "Databases" → "Create" → "Database"
3. Nombre: `centro_deportivo`
4. Click "Save"

---

## Paso 3: Configurar el Backend

### 3.1 Ir a la carpeta del backend
```bash
cd ProyectoFinal/backend
```

### 3.2 Instalar dependencias
```bash
npm install
```

### 3.3 Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

### 3.4 Editar el archivo .env
Abrir el archivo `.env` y configurar:

```env
# Conexión a PostgreSQL
# Formato: postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD
DATABASE_URL="postgresql://postgres:tu_contraseña@localhost:5432/centro_deportivo"

# JWT (puedes dejar este valor o cambiarlo)
JWT_SECRET="mi-secreto-super-seguro-2024"
JWT_EXPIRES_IN="24h"

# Servidor
PORT=3001
NODE_ENV=development

# Email (opcional - para notificaciones)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicacion"
```

**IMPORTANTE:** Reemplaza `tu_contraseña` con la contraseña de tu PostgreSQL.

### 3.5 Generar el cliente de Prisma
```bash
npm run prisma:generate
```

### 3.6 Ejecutar las migraciones (crear tablas)
```bash
npm run prisma:migrate
```
Cuando pregunte el nombre de la migración, escribe: `init`

### 3.7 Cargar datos de prueba
```bash
npm run prisma:seed
```

### 3.8 Iniciar el servidor
```bash
npm run start:dev
```

✅ El backend estará corriendo en: **http://localhost:3001**
✅ Documentación API en: **http://localhost:3001/api/docs**

---

## Paso 4: Configurar el Frontend

### 4.1 Abrir otra terminal e ir a la carpeta frontend
```bash
cd ProyectoFinal/frontend
```

### 4.2 Instalar dependencias
```bash
npm install
```

### 4.3 Iniciar el servidor de desarrollo
```bash
npm run dev
```

✅ El frontend estará corriendo en: **http://localhost:3000**

---

## Paso 5: Probar el Sistema

### Credenciales de prueba:

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | admin@centrodeportivo.com | admin123 |
| **Cliente** | cliente@test.com | cliente123 |

### Flujo de prueba:

1. Abrir http://localhost:3000
2. Click en "Ver Canchas Disponibles"
3. Registrarse o iniciar sesión
4. Seleccionar una cancha
5. Elegir fecha y horario
6. Completar el pago
7. Ver la reserva en "Mis Reservas"

---

## Comandos Útiles

### Backend
```bash
# Iniciar en desarrollo (con hot reload)
npm run start:dev

# Ver base de datos en interfaz gráfica
npm run prisma:studio

# Resetear base de datos (BORRA TODO)
npx prisma migrate reset

# Crear nueva migración después de cambiar schema
npm run prisma:migrate
```

### Frontend
```bash
# Iniciar en desarrollo
npm run dev

# Crear build de producción
npm run build

# Iniciar en producción
npm run start
```

---

## Solución de Problemas

### Error: "Can't reach database server"
- Verificar que PostgreSQL está corriendo
- Verificar usuario y contraseña en `.env`
- Verificar que la base de datos existe

```bash
# Verificar estado de PostgreSQL (Linux)
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -d centro_deportivo -c "SELECT 1"
```

### Error: "Port 3001 already in use"
```bash
# Matar el proceso en el puerto (Linux/Mac)
kill $(lsof -t -i:3001)

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error en Prisma
```bash
# Regenerar cliente
npm run prisma:generate

# Si hay problemas con migraciones
npx prisma migrate reset
npm run prisma:seed
```

---

## Estructura de Archivos Importantes

```
ProyectoFinal/
├── backend/
│   ├── .env                 ← CONFIGURAR ESTO
│   ├── prisma/
│   │   └── schema.prisma    ← Modelo de datos
│   └── src/
│       └── main.ts          ← Entrada del servidor
│
└── frontend/
    ├── app/                 ← Páginas
    └── lib/api.ts           ← Cliente API
```

---

## Resumen de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## Checklist Final

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `centro_deportivo` creada
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 3000
- [ ] Puedo iniciar sesión con las credenciales de prueba
