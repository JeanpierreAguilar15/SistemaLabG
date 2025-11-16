# 🔐 CREDENCIALES DE ACCESO - SISTEMA LABORATORIO CLÍNICO

## 📍 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3105/api/v1
- **Login**: http://localhost:3000/auth/login
- **Registro**: http://localhost:3000/auth/register

---

## 👤 USUARIOS DE PRUEBA

### 🔴 ADMINISTRADOR
- **Email**: admin@lab.com
- **Cédula**: 1710034065
- **Contraseña**: Password123!
- **Rol**: Administrador del sistema
- **Acceso completo a todas las funcionalidades**

---

### 🩺 MÉDICOS

#### Dr. María Fernanda González
- **Email**: dra.gonzalez@lab.com
- **Cédula**: 1715678901
- **Contraseña**: Password123!
- **Rol**: Médico
- **Permisos**: Validación de resultados, consulta de pacientes

#### Dr. José Luis Ramírez
- **Email**: dr.ramirez@lab.com
- **Cédula**: 1703456789
- **Contraseña**: Password123!
- **Rol**: Médico
- **Permisos**: Validación de resultados, consulta de pacientes

---

### 🔬 LABORATORISTAS

#### Ana Patricia Morales
- **Email**: ana.morales@lab.com
- **Cédula**: 1708901234
- **Contraseña**: Password123!
- **Rol**: Laboratorista
- **Permisos**: Procesamiento de muestras, ingreso de resultados

#### Roberto Carlos Herrera
- **Email**: roberto.herrera@lab.com
- **Cédula**: 1712345678
- **Contraseña**: Password123!
- **Rol**: Laboratorista
- **Permisos**: Procesamiento de muestras, ingreso de resultados

---

### 📋 RECEPCIONISTAS

#### Sofía Isabel Torres
- **Email**: sofia.torres@lab.com
- **Cédula**: 1706789012
- **Contraseña**: Password123!
- **Rol**: Recepcionista
- **Permisos**: Gestión de citas, registro de pacientes

#### Diana Carolina Salazar
- **Email**: diana.salazar@lab.com
- **Cédula**: 1709012345
- **Contraseña**: Password123!
- **Rol**: Recepcionista
- **Permisos**: Gestión de citas, registro de pacientes

---

### 👥 PACIENTES

#### Juan Pablo Jiménez
- **Email**: juan.jimenez@gmail.com
- **Cédula**: 1704567890
- **Contraseña**: Password123!
- **Tipo de sangre**: O+
- **Condiciones**: Hipertensión

#### Laura Beatriz Mendoza
- **Email**: laura.mendoza@hotmail.com
- **Cédula**: 1707890123
- **Contraseña**: Password123!
- **Tipo de sangre**: A+
- **Condiciones**: Ninguna

#### Miguel Ángel Vargas
- **Email**: miguel.vargas@yahoo.com
- **Cédula**: 1701234567
- **Contraseña**: Password123!
- **Tipo de sangre**: B-
- **Condiciones**: Diabetes tipo 2

#### Carmen Rosa Espinoza
- **Email**: carmen.espinoza@outlook.com
- **Cédula**: 1713456789
- **Contraseña**: Password123!
- **Tipo de sangre**: AB+
- **Condiciones**: Asma leve

#### Ricardo Andrés Núñez
- **Email**: ricardo.nunez@gmail.com
- **Cédula**: 1705678901
- **Contraseña**: Password123!

---

## ⚙️ CONFIGURACIÓN DEL SISTEMA

### 📁 Ubicación del archivo .env

```
Backend: /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend/.env
Frontend: /home/user/SistemaLabG/SistemaWebLaboratorio/Software/frontend/.env.local
```

### 🔑 Variables de Entorno Backend (.env)

```env
# Base de Datos PostgreSQL
DATABASE_URL=postgres://postgres:admin1234@localhost:5432/Lab_Bd

# JWT Secrets
JWT_ACCESS_SECRET=dev_access
JWT_REFRESH_SECRET=dev_refresh
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=30d

# Servidor
NODE_ENV=development
PORT=3105
API_PREFIX=api/v1

# CORS
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Email SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=reimblox@gmail.com
EMAIL_FROM=Laboratorio Franz <reimblox@gmail.com>
```

### 🎨 Variables de Entorno Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3105/api/v1
```

---

## 📊 CARGAR DATOS DE PRUEBA

### Opción 1: Usando psql (Recomendado)

```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend

# Ejecutar el script SQL
psql -U postgres -d Lab_Bd -f prisma/seed.sql
```

### Opción 2: Desde PostgreSQL CLI

```bash
# Conectarse a la base de datos
psql -U postgres -d Lab_Bd

# Dentro de psql
\i /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend/prisma/seed.sql
```

### Opción 3: Usando DBeaver o pgAdmin

1. Conectarse a la base de datos `Lab_Bd`
2. Abrir el archivo `prisma/seed.sql`
3. Ejecutar el script

---

## 🧪 DATOS INCLUIDOS EN EL SEED

El script `seed.sql` incluye datos de prueba para:

✅ **5 Roles**: Admin, Médico, Laboratorista, Recepcionista, Paciente
✅ **12 Usuarios**: 1 Admin, 2 Médicos, 2 Laboratoristas, 2 Recepcionistas, 5 Pacientes
✅ **3 Sedes**: Norte, Centro, Sur
✅ **3 Servicios**: Toma de Muestras, Entrega de Resultados, Consulta Médica
✅ **6 Categorías de Exámenes**: Hematología, Química Clínica, Inmunología, etc.
✅ **16 Exámenes**: Hemograma, Glucosa, Perfil Lipídico, TSH, etc.
✅ **4 Paquetes**: Chequeo Básico, Perfil Completo, Control Diabético, Perfil Tiroideo
✅ **8 Slots de Citas**: Horarios disponibles para los próximos días
✅ **4 Citas Agendadas**: Citas para pacientes de prueba
✅ **3 Cotizaciones**: Cotizaciones pendientes y aprobadas
✅ **2 Pagos Completados**: Con facturas emitidas
✅ **3 Muestras**: En diferentes estados (Procesada, En análisis)
✅ **8 Resultados**: Algunos validados, otros en proceso
✅ **7 Items de Inventario**: Reactivos, tubos, guantes, jeringas
✅ **6 Lotes**: Con fechas de vencimiento
✅ **3 Proveedores**: Proveedores de insumos médicos
✅ **2 Órdenes de Compra**: Órdenes pendientes y aprobadas
✅ **4 Notificaciones**: Recordatorios y avisos enviados

---

## 🔒 VALIDACIONES IMPLEMENTADAS

### ✅ Validación de Cédula Ecuatoriana

- **Ubicación**: `frontend/lib/utils.ts`
- **Función**: `validateCedulaEcuador(cedula: string)`
- **Validaciones**:
  - Longitud exacta de 10 dígitos
  - Código de provincia válido (01-24)
  - Algoritmo de módulo 10 para dígito verificador
- **Uso**: Automático en el formulario de registro

### 🔐 Medidor de Seguridad de Contraseña

- **Ubicación**: `frontend/lib/utils.ts`
- **Función**: `checkPasswordStrength(password: string)`
- **Niveles**:
  - 🔴 **Débil**: Menos de 8 caracteres, falta variedad
  - 🟠 **Moderada**: 8+ caracteres, mezcla básica
  - 🟢 **Fuerte**: 12+ caracteres, buena mezcla
  - 🟢🟢 **Muy Fuerte**: 16+ caracteres, incluye especiales
- **Características medidas**:
  - Longitud (8, 12, 16+ caracteres)
  - Letras minúsculas
  - Letras mayúsculas
  - Números
  - Caracteres especiales (!@#$%^&*)
- **Interfaz**: Barra de progreso visual con feedback en tiempo real

---

## 🚀 CÓMO INICIAR EL SISTEMA

### 1️⃣ Asegúrate que PostgreSQL esté corriendo

```bash
# Verificar estado
sudo service postgresql status

# Iniciar si está detenido
sudo service postgresql start
```

### 2️⃣ Cargar datos de prueba (si no lo has hecho)

```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend
psql -U postgres -d Lab_Bd -f prisma/seed.sql
```

### 3️⃣ Iniciar Backend

```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend
npm run start:dev
```

### 4️⃣ Iniciar Frontend

```bash
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/frontend
npm run dev
```

### 5️⃣ Acceder al sistema

- Abre tu navegador en: http://localhost:3000
- Usa cualquiera de las credenciales de arriba para ingresar

---

## 📝 NOTAS IMPORTANTES

⚠️ **Contraseña por defecto**: Todos los usuarios tienen la contraseña `Password123!`

⚠️ **Hashes de contraseña**: En el script SQL los hashes son de ejemplo. En producción, las contraseñas se hashean automáticamente con bcrypt al registrarse.

⚠️ **Cédulas válidas**: Todas las cédulas en el seed son ecuatorianas válidas (pasan el algoritmo de validación).

⚠️ **Datos de prueba**: Estos datos son solo para desarrollo. NO usar en producción.

⚠️ **Email**: El sistema tiene configurado SMTP de Gmail. Para enviar emails reales, configura tus credenciales en `.env`

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "relation does not exist"
```bash
# Ejecutar migraciones
cd backend
npx prisma migrate dev
```

### Error: "password authentication failed"
```bash
# Verificar credenciales en .env
DATABASE_URL=postgres://postgres:admin1234@localhost:5432/Lab_Bd
```

### Error: "ECONNREFUSED"
```bash
# Verificar que PostgreSQL esté corriendo
sudo service postgresql status
sudo service postgresql start
```

---

## 📧 SOPORTE

Para cualquier duda o problema, revisa:
- Logs del backend: Terminal donde corre `npm run start:dev`
- Logs del frontend: Terminal donde corre `npm run dev`
- Consola del navegador: F12 → Console

---

**¡Listo para usar! 🎉**

Sistema Laboratorio Clínico Franz - Versión 1.0
