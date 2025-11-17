# 🚀 Guía de Instalación y Ejecución - Sistema Laboratorio Franz

Guía completa para ejecutar el sistema en local desde la rama con todos los módulos implementados.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- Git instalado
- npm o yarn

---

## 🔽 PASO 1: Clonar/Actualizar el Repositorio

### Opción A: Si NO tienes el repo clonado

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO> SistemaLabG
cd SistemaLabG

# Cambiar a la rama con todos los módulos
git checkout claude/add-admin-service-events-018kHHfknnVhFazooYM8bCtQ
```

### Opción B: Si YA tienes el repo clonado

```bash
# Navegar al proyecto
cd SistemaLabG

# Traer los últimos cambios
git fetch origin

# Cambiar a la rama con todos los módulos
git checkout claude/add-admin-service-events-018kHHfknnVhFazooYM8bCtQ

# Actualizar con los últimos cambios
git pull origin claude/add-admin-service-events-018kHHfknnVhFazooYM8bCtQ
```

---

## 🗄️ PASO 2: Configurar Base de Datos PostgreSQL

### 2.1 Crear la Base de Datos

```bash
# Conectarse a PostgreSQL (ajustar según tu instalación)
psql -U postgres

# Dentro de psql:
CREATE DATABASE laboratorio_franz;
CREATE USER lab_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE laboratorio_franz TO lab_user;
\q
```

### 2.2 Verificar Conexión

```bash
# Probar conexión
psql -U lab_user -d laboratorio_franz -h localhost

# Si conecta correctamente, salir con:
\q
```

---

## ⚙️ PASO 3: Configurar Backend

### 3.1 Navegar al Backend

```bash
cd SistemaWebLaboratorio/Software/backend
```

### 3.2 Crear Archivo .env

```bash
# Crear archivo .env
touch .env

# O en Windows:
# type nul > .env
```

### 3.3 Configurar Variables de Entorno

Editar el archivo `.env` con el siguiente contenido:

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://lab_user:tu_password_seguro@localhost:5432/laboratorio_franz?schema=public"

# ============================================
# JWT SECRETS
# ============================================
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion-2025"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro-cambiar-2025"

# JWT Expiration
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# ============================================
# APPLICATION
# ============================================
NODE_ENV="development"
PORT=3000

# CORS
CORS_ORIGIN="http://localhost:3001,http://localhost:5173"

# ============================================
# FILE UPLOADS
# ============================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# ============================================
# EMAIL (Opcional - para notificaciones)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password"
EMAIL_FROM="Laboratorio Franz <noreply@labfranz.com>"

# ============================================
# RATE LIMITING
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ============================================
# SECURITY
# ============================================
BCRYPT_ROUNDS=10
```

**IMPORTANTE:** Reemplazar:
- `tu_password_seguro` con la contraseña que creaste para `lab_user`
- `tu-secreto-super-seguro-*` con secretos aleatorios largos
- Configuración de email (opcional, solo si vas a usar notificaciones por email)

### 3.4 Instalar Dependencias

```bash
# Instalar todas las dependencias del backend
npm install

# Esto puede tardar 2-3 minutos
```

### 3.5 Configurar Prisma y Base de Datos

```bash
# 1. Generar el cliente de Prisma
npm run prisma:generate

# 2. Ver estado de migraciones
npx prisma migrate status

# 3. Aplicar todas las migraciones
npx prisma migrate deploy

# 4. (Opcional) Resetear BD si ya existía con datos viejos
# CUIDADO: Esto borra TODOS los datos
npx prisma migrate reset --skip-seed

# 5. Ejecutar el seed para poblar datos iniciales
npm run prisma:seed

# 6. (Opcional) Abrir Prisma Studio para ver los datos
npm run prisma:studio
# Se abrirá en http://localhost:5555
```

### 3.6 Verificar que todo está OK

```bash
# Ver las tablas creadas
psql -U lab_user -d laboratorio_franz -c "\dt usuarios.*"
psql -U lab_user -d laboratorio_franz -c "\dt catalogo.*"
psql -U lab_user -d laboratorio_franz -c "\dt pagos.*"
```

Deberías ver todas las tablas de los diferentes schemas.

---

## 🎯 PASO 4: Ejecutar Backend

### 4.1 Ejecutar Tests (Opcional pero Recomendado)

```bash
# Ejecutar todos los tests
npm test

# O ejecutar con cobertura
npm run test:cov
```

### 4.2 Iniciar el Servidor Backend

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev

# O modo normal
npm start
```

**Deberías ver:**
```
[Nest] 12345  - 17/11/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG [RoutesResolver] AgendaController {/api/agenda}
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG [RoutesResolver] ResultadosController {/api/resultados}
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG [RoutesResolver] CotizacionesController {/api/cotizaciones}
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG [RoutesResolver] PagosController {/api/pagos}
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 17/11/2025, 10:30:01 AM     LOG Application running on: http://localhost:3000
```

### 4.3 Verificar que el Backend funciona

Abrir otra terminal y ejecutar:

```bash
# Verificar salud del servidor
curl http://localhost:3000/health
# Debería retornar: {"status":"ok"}

# Ver documentación Swagger
# Abrir en navegador: http://localhost:3000/api/docs
```

---

## 🎨 PASO 5: Configurar Frontend

### 5.1 Navegar al Frontend

```bash
# Abrir NUEVA terminal (dejar backend corriendo)
cd SistemaWebLaboratorio/Software/frontend
```

### 5.2 Crear Archivo .env

```bash
# Crear archivo .env
touch .env.local

# O en Windows:
# type nul > .env.local
```

### 5.3 Configurar Variables de Entorno del Frontend

Editar el archivo `.env.local`:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# App Config
VITE_APP_NAME="Laboratorio Clínico Franz"
VITE_APP_VERSION="1.0.0"

# Environment
VITE_ENV=development
```

### 5.4 Instalar Dependencias

```bash
# Instalar todas las dependencias del frontend
npm install

# Esto puede tardar 2-3 minutos
```

### 5.5 Iniciar el Servidor Frontend

```bash
# Modo desarrollo
npm run dev

# O con host específico
npm run dev -- --host
```

**Deberías ver:**
```
  VITE v5.x.x  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🌐 PASO 6: Acceder al Sistema

### 6.1 Abrir el Navegador

```
http://localhost:5173
```

### 6.2 Credenciales de Prueba (del seed)

**Administrador:**
- Email: `admin@labfranz.com`
- Password: `Admin123!`

**Técnico:**
- Email: `tecnico@labfranz.com`
- Password: `Tecnico123!`

**Paciente:**
- Email: `paciente@labfranz.com`
- Password: `Paciente123!`

---

## 🧪 PASO 7: Probar el Sistema

### 7.1 Flujo de Prueba - Cotizaciones y Pagos

1. **Login como Paciente:**
   ```
   Email: paciente@labfranz.com
   Password: Paciente123!
   ```

2. **Ir a Cotizaciones → Nueva Cotización**
   - Verás checklist de exámenes organizados por categoría
   - Selecciona varios exámenes (Hemograma, Glucosa, etc.)
   - Observa que el precio se calcula automáticamente
   - Verás los requisitos (ayuno, preparación)
   - Click "Generar Cotización"

3. **Descargar PDF de Cotización:**
   - Ve a "Mis Cotizaciones"
   - Click en "Descargar PDF"
   - Verifica que el PDF se descarga con todos los detalles

4. **Registrar Pago:**
   - Ve a "Pagos" → "Nuevo Pago"
   - Selecciona la cotización
   - Ingresa el monto (debe coincidir con el total)
   - Selecciona método de pago
   - Click "Registrar Pago"

5. **Verificar:**
   - Ve a "Mis Cotizaciones"
   - La cotización debe estar en estado "PAGADA"

### 7.2 Flujo de Prueba - Agenda

1. **Login como Admin:**
   ```
   Email: admin@labfranz.com
   Password: Admin123!
   ```

2. **Crear Slot (Horario Disponible):**
   - Ir a "Agenda" → "Crear Horario"
   - Selecciona servicio (ej: "Consulta General")
   - Selecciona sede
   - Fecha futura
   - Hora inicio/fin
   - Cupos totales: 5
   - Click "Crear"

3. **Login como Paciente y Agendar Cita:**
   - Logout y login como paciente
   - Ir a "Agenda" → "Agendar Cita"
   - Buscar horarios disponibles
   - Seleccionar un slot
   - Ingresar motivo
   - Click "Agendar"

4. **Verificar:**
   - Ve a "Mis Citas"
   - Deberías ver tu cita agendada

### 7.3 Flujo de Prueba - Resultados

1. **Login como Técnico:**
   ```
   Email: tecnico@labfranz.com
   Password: Tecnico123!
   ```

2. **Registrar Muestra:**
   - Ir a "Muestras" → "Nueva Muestra"
   - Seleccionar paciente
   - ID muestra: MUE-001
   - Tipo: Sangre
   - Fecha de toma: hoy
   - Click "Registrar"

3. **Procesar Resultado:**
   - Ir a "Resultados" → "Nuevo Resultado"
   - Seleccionar muestra
   - Seleccionar examen (ej: Glucosa)
   - Ingresar valor numérico: 95
   - Rango normal: 70-100
   - Click "Procesar"
   - El sistema calculará automáticamente el nivel: NORMAL

4. **Validar Resultado (genera PDF):**
   - En la lista de resultados
   - Click "Validar" en el resultado
   - El sistema genera el PDF automáticamente

5. **Login como Paciente y Descargar:**
   - Logout y login como paciente
   - Ir a "Mis Resultados"
   - Click "Descargar PDF"
   - El resultado cambia automáticamente a "ENTREGADO"

---

## 📊 PASO 8: Verificar en Prisma Studio

```bash
# Abrir Prisma Studio (en terminal del backend)
npm run prisma:studio

# Se abre en http://localhost:5555
```

**Ver:**
- Tabla `Cotizacion`: Ver cotizaciones creadas
- Tabla `CotizacionDetalle`: Ver exámenes seleccionados
- Tabla `Pago`: Ver pagos registrados
- Tabla `Cita`: Ver citas agendadas
- Tabla `Resultado`: Ver resultados procesados
- Tabla `DescargaResultado`: Ver auditoría de descargas

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL está corriendo
# Linux/Mac:
sudo systemctl status postgresql
# Windows:
# Verificar en Servicios de Windows

# Verificar conexión manualmente
psql -U lab_user -d laboratorio_franz -h localhost

# Verificar DATABASE_URL en .env
cat .env | grep DATABASE_URL
```

### Error: "Port 3000 is already in use"

```bash
# Cambiar puerto en backend/.env
PORT=3001

# Y actualizar frontend/.env.local
VITE_API_URL=http://localhost:3001/api
```

### Error: "Prisma Client not generated"

```bash
cd backend
npm run prisma:generate
```

### Error: "Module not found"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error de CORS

Verificar que en `backend/.env`:
```env
CORS_ORIGIN="http://localhost:5173"
```

---

## 📝 Resumen de Comandos Rápidos

### Primera Vez (Setup Completo)

```bash
# 1. Clonar y cambiar de rama
git clone <URL> SistemaLabG
cd SistemaLabG
git checkout claude/add-admin-service-events-018kHHfknnVhFazooYM8bCtQ

# 2. Backend
cd SistemaWebLaboratorio/Software/backend
npm install
cp .env.example .env  # Editar con tus valores
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev  # Terminal 1

# 3. Frontend (nueva terminal)
cd SistemaWebLaboratorio/Software/frontend
npm install
cp .env.example .env.local  # Editar con tus valores
npm run dev  # Terminal 2
```

### Día a Día (Ya configurado)

```bash
# Terminal 1: Backend
cd SistemaWebLaboratorio/Software/backend
npm run start:dev

# Terminal 2: Frontend
cd SistemaWebLaboratorio/Software/frontend
npm run dev

# Terminal 3 (opcional): Prisma Studio
cd SistemaWebLaboratorio/Software/backend
npm run prisma:studio
```

---

## 🎉 Sistema Corriendo

Una vez todo esté ejecutándose:

- ✅ **Backend API:** http://localhost:3000
- ✅ **Swagger Docs:** http://localhost:3000/api/docs
- ✅ **Frontend:** http://localhost:5173
- ✅ **Prisma Studio:** http://localhost:5555
- ✅ **Base de Datos:** PostgreSQL localhost:5432

## 📚 Módulos Disponibles

- ✅ **Autenticación:** Login, registro, JWT
- ✅ **Admin:** Gestión de usuarios, roles, servicios, sedes
- ✅ **Agenda:** Horarios disponibles, citas, cancelaciones
- ✅ **Resultados:** Muestras, resultados, PDF, descarga con auditoría
- ✅ **Cotizaciones:** Checklist dinámico, cálculo automático, PDF
- ✅ **Pagos:** Registro, vinculación con cotizaciones, estadísticas
- ✅ **WebSocket:** Notificaciones en tiempo real

**¡Todo listo para probar! 🚀**
