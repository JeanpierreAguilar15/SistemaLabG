# ⚡ Quick Start - Sistema Laboratorio Franz

Guía rápida para ejecutar el sistema en 5 minutos.

## 🚀 Setup Rápido

### 1. Base de Datos

```bash
# Crear BD en PostgreSQL
psql -U postgres
```

```sql
CREATE DATABASE laboratorio_franz;
CREATE USER lab_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE laboratorio_franz TO lab_user;
\q
```

### 2. Backend

```bash
cd SistemaWebLaboratorio/Software/backend

# Crear .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://lab_user:tu_password@localhost:5432/laboratorio_franz"
JWT_SECRET="tu-secreto-super-seguro-jwt-2025"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro-2025"
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
EOF

# Instalar y configurar
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

### 3. Frontend (Nueva Terminal)

```bash
cd SistemaWebLaboratorio/Software/frontend

# Crear .env.local
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME="Laboratorio Clínico Franz"
EOF

# Instalar y ejecutar
npm install
npm run dev
```

## 🌐 Acceder

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs

## 👤 Credenciales de Prueba

```
Admin:
  Email: admin@labfranz.com
  Password: Admin123!

Técnico:
  Email: tecnico@labfranz.com
  Password: Tecnico123!

Paciente:
  Email: paciente@labfranz.com
  Password: Paciente123!
```

## ✅ Probar Funcionalidad

### Cotizaciones

1. Login como **Paciente**
2. Ir a **Cotizaciones** → **Nueva**
3. Seleccionar exámenes (Hemograma, Glucosa)
4. Ver precio calculado automáticamente
5. Generar cotización y descargar PDF

### Pagos

1. En **Pagos** → **Nuevo**
2. Seleccionar cotización
3. Ingresar monto (debe coincidir)
4. Registrar pago
5. Verificar cotización cambia a **PAGADA**

### Agenda

1. Login como **Admin**
2. **Agenda** → **Crear Horario**
3. Crear slot con 5 cupos
4. Login como **Paciente**
5. **Agenda** → **Agendar Cita**
6. Seleccionar horario y agendar

### Resultados

1. Login como **Técnico**
2. **Muestras** → **Nueva Muestra**
3. **Resultados** → **Nuevo Resultado**
4. Ingresar valor: 95 (rango 70-100) → Nivel NORMAL
5. **Validar** resultado (genera PDF)
6. Login como **Paciente**
7. **Mis Resultados** → **Descargar PDF**

## 🐛 Comandos Útiles

```bash
# Ver logs del backend
npm run start:dev

# Ver datos en Prisma Studio
npm run prisma:studio
# http://localhost:5555

# Ejecutar tests
npm test

# Resetear BD (CUIDADO: borra todo)
npx prisma migrate reset
npm run prisma:seed
```

## 📊 Verificar Todo Funciona

```bash
# Backend health
curl http://localhost:3000/health

# Frontend
curl http://localhost:5173

# Ver tablas en BD
psql -U lab_user -d laboratorio_franz -c "\dt usuarios.*"
```

## 🎯 Módulos Implementados

- ✅ Autenticación (JWT)
- ✅ Admin (Usuarios, Roles, Servicios)
- ✅ Agenda (Slots, Citas)
- ✅ Resultados (Muestras, PDFs, Niveles automáticos)
- ✅ Cotizaciones (Checklist, Precios automáticos, PDFs)
- ✅ Pagos (Registro, Vinculación, Estadísticas)
- ✅ WebSocket (Notificaciones en tiempo real)
- ✅ Tests (76+ tests unitarios)

**¡Listo para usar! 🚀**

---

**Documentación completa:** Ver `INSTALACION_LOCAL.md`
