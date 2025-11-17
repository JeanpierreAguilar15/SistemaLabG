# 🔐 Credenciales de Acceso y Guía de Pruebas

## Credenciales de Usuario

### Administrador
- **Email**: `admin@lab.com`
- **Password**: `admin123`
- **Cédula**: `1710034065`

### Pacientes (Para Pruebas)

#### Paciente 1 - María José González
- **Email**: `maria.gonzalez@example.com`
- **Password**: `Paciente123!`
- **Cédula**: `1721456789`
- **Tipo de Sangre**: O+
- **Alergias**: Penicilina, Polen

#### Paciente 2 - Juan Carlos Morales
- **Email**: `juan.morales@example.com`
- **Password**: `Paciente123!`
- **Cédula**: `1712345678`
- **Tipo de Sangre**: A+
- **Condición**: Hipertensión
- **Medicamentos**: Losartán 50mg

#### Paciente 3 - Ana Patricia Rodríguez
- **Email**: `ana.rodriguez@example.com`
- **Password**: `Paciente123!`
- **Cédula**: `1723456789`
- **Tipo de Sangre**: B+

### Personal de Laboratorio
- **Email**: `laboratorio@lab.com`
- **Password**: `Personal123!`
- **Cédula**: `1745678901`

### Recepcionista
- **Email**: `recepcion@lab.com`
- **Password**: `Recepcion123!`
- **Cédula**: `1734567890`

---

## 📋 Exámenes Disponibles en el Catálogo

### Hematología
1. **Hemograma Completo** - $15.00
   - Código: HCTO-001
   - No requiere ayuno
   - Tiempo entrega: 24 horas

### Bioquímica
2. **Glucosa en Ayunas** - $5.00
   - Código: BIOQ-001
   - ⚠️ Requiere ayuno de 8 horas
   - Tiempo entrega: 4 horas
   - Valores de referencia: 70-100 mg/dL

3. **Perfil Lipídico** - $25.00
   - Código: BIOQ-002
   - ⚠️ Requiere ayuno de 12 horas
   - Incluye: Colesterol total, HDL, LDL, Triglicéridos
   - Tiempo entrega: 24 horas

4. **Creatinina** - $8.00
   - Código: BIOQ-003
   - No requiere ayuno
   - Tiempo entrega: 24 horas
   - Valores de referencia: 0.6-1.2 mg/dL

### Urianálisis
5. **Examen General de Orina** - $8.00
   - Código: URIN-001
   - No requiere ayuno
   - Preparación: Primera orina de la mañana (preferiblemente)
   - Tiempo entrega: 4 horas

---

## 🧪 Pasos para Poblar la Base de Datos

Si aún no has ejecutado el seed, corre estos comandos:

```bash
cd SistemaWebLaboratorio/Software/backend

# Opcional: Resetear la base de datos (CUIDADO: borra todos los datos)
# npx prisma migrate reset --skip-seed

# Ejecutar el seed para poblar datos de prueba
npm run prisma:seed
```

Esto creará:
- ✅ 5 roles (Admin, Personal Lab, Médico, Recepción, Paciente)
- ✅ 1 administrador
- ✅ 3 pacientes con perfiles médicos
- ✅ 1 recepcionista
- ✅ 1 personal de laboratorio
- ✅ 1 sede
- ✅ 2 servicios
- ✅ 4 categorías de exámenes
- ✅ 5 exámenes con precios

---

## ✅ Funcionalidades Implementadas para Probar

### Como Paciente

#### 1. Cotizaciones (✨ Checkboxes + Cálculo Automático)
1. Inicia sesión como paciente
2. Ve a **Portal > Cotizaciones**
3. Verás una lista de exámenes con checkboxes
4. **Selecciona los exámenes** que desees haciendo clic en el checkbox
5. **Ajusta la cantidad** usando los botones + y -
6. El **total se calcula automáticamente** en el panel de la derecha
7. Haz clic en **Generar Cotización**
8. La cotización aparecerá en el historial abajo
9. Puedes **descargar el PDF** de la cotización

**Ejemplo de prueba:**
- Selecciona: Hemograma Completo (1x) = $15.00
- Selecciona: Glucosa en Ayunas (1x) = $5.00
- Selecciona: Perfil Lipídico (2x) = $50.00
- **Total automático: $70.00**

#### 2. Citas
1. Ve a **Portal > Citas**
2. Haz clic en **Agendar Nueva Cita**
3. Llena el formulario y agenda
4. Puedes ver, confirmar o cancelar tus citas

#### 3. Resultados
1. Ve a **Portal > Resultados**
2. Verás tus resultados de laboratorio
3. Puedes descargar el PDF de cada resultado

#### 4. Perfil
1. Ve a **Portal > Perfil**
2. Actualiza tu información personal
3. Cambia tu contraseña
4. Gestiona consentimientos

### Como Administrador

#### 1. Panel de Administración
1. Inicia sesión como admin
2. Ve a **Admin > Dashboard**
3. Verás estadísticas del sistema

#### 2. Gestión de Usuarios
1. Ve a **Admin > Usuarios**
2. Gestiona usuarios del sistema
3. Activa/desactiva usuarios

---

## 🚀 Inicio Rápido para Pruebas

### Backend
```bash
cd SistemaWebLaboratorio/Software/backend
npm run start:dev
```
✅ Backend corriendo en: http://localhost:3001

### Frontend
```bash
cd SistemaWebLaboratorio/Software/frontend
npm run dev
```
✅ Frontend corriendo en: http://localhost:3000

### Flujo de Prueba Recomendado

1. **Inicia sesión como paciente** (maria.gonzalez@example.com / Paciente123!)
2. **Ve a Cotizaciones**
3. **Selecciona varios exámenes** usando los checkboxes
4. **Observa el cálculo automático** del total en tiempo real
5. **Genera la cotización**
6. **Descarga el PDF** de la cotización generada

---

## 📝 Notas Importantes

- Los precios se calculan automáticamente al seleccionar exámenes
- Puedes ajustar la cantidad de cada examen (mínimo 1)
- El sistema valida que los exámenes existan y tengan precio
- Las cotizaciones tienen estados: PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA_A_PAGO, EXPIRADA
- Los resultados muestran niveles: NORMAL, BAJO, ALTO, CRÍTICO (calculados automáticamente)
- El sistema implementa arquitectura event-driven para trazabilidad completa

---

## 🔍 URLs Importantes

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Login**: http://localhost:3000/auth/login
- **Portal Paciente**: http://localhost:3000/portal
- **Admin**: http://localhost:3000/admin

---

## 🐛 Troubleshooting

### Frontend muestra "undefined" en las URLs
- Verifica que `.env.local` tenga `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
- Reinicia el servidor del frontend

### Backend no inicia
- Verifica que PostgreSQL esté corriendo
- Revisa la conexión en el `.env`: `DATABASE_URL`
- Ejecuta `npm install` nuevamente

### No hay exámenes en el catálogo
- Ejecuta el seed: `npm run prisma:seed`
- Verifica que la migración esté aplicada: `npx prisma migrate status`

---

¡Disfruta probando el sistema! 🎉
