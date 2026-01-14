# ALCANCE DEL SISTEMA - LABORATORIO CLINICO FRANZ

## Descripcion General

El **Sistema Web de Gestion para Laboratorio Clinico Franz** es una plataforma integral diseñada para automatizar y optimizar todos los procesos operativos de un laboratorio de analisis clinicos. El sistema permite la gestion completa del ciclo de atencion al paciente, desde la solicitud de examenes hasta la entrega de resultados, incluyendo un chatbot con inteligencia artificial para atencion 24/7.

---

## MODULOS PRINCIPALES

### 1. GESTION DE USUARIOS Y AUTENTICACION

- Registro de pacientes con validacion de cedula de identidad
- Sistema de roles y permisos (Administrador, Laboratorista, Paciente)
- Autenticacion segura con JWT y tokens de refresco
- Bloqueo automatico de cuenta por intentos fallidos
- Recuperacion de contraseña via correo electronico
- Gestion de sesiones activas y cierre remoto

### 2. GESTION DE CITAS Y AGENDA

- Calendario de disponibilidad por sede y servicio
- Generacion automatica de slots de horarios disponibles
- Agendamiento de citas en linea por pacientes
- Confirmacion de asistencia por parte del paciente
- Gestion de feriados y dias no laborables
- Cancelacion y reprogramacion de citas
- Vista de agenda diaria para administradores

### 3. GESTION DE COTIZACIONES Y PAGOS

- Generacion de cotizaciones con multiples examenes
- Estados de cotizacion (Pendiente, Pendiente Pago Ventanilla, Pagada, Expirada)
- Pasarela de pagos en linea integrada
- Registro de pagos en ventanilla
- Historial de transacciones y comprobantes
- Expiracion automatica de cotizaciones no pagadas
- Facturacion electronica

### 4. GESTION DE RESULTADOS DE LABORATORIO

- Carga de resultados por examen individual
- Agrupacion de resultados por cita (multiples examenes juntos)
- Validacion de resultados por laboratorista autorizado
- Generacion de PDF con resultados
- Subida de archivos adjuntos a AWS S3
- Notificacion automatica al paciente cuando resultados estan listos
- Historial completo de resultados del paciente

### 5. CHATBOT CON INTELIGENCIA ARTIFICIAL

- Integracion con Google Dialogflow para procesamiento de lenguaje natural
- Consulta de horarios disponibles
- Agendamiento de citas via conversacion
- Consulta de resultados de examenes
- Informacion de servicios y precios
- Respuestas automaticas 24/7
- Escalamiento a agente humano cuando es necesario

### 6. GESTION DE INVENTARIO Y PROVEEDORES

- Control de stock de reactivos e insumos
- Alertas automaticas de stock minimo
- Registro de proveedores con informacion de contacto
- Ordenes de compra y seguimiento
- Movimientos de inventario (entradas, salidas, ajustes)
- Trazabilidad completa de cada producto
- Reportes de consumo y proyecciones

### 7. CATALOGO DE SERVICIOS Y EXAMENES

- Registro de examenes con precios y tiempos de entrega
- Categorias de examenes (Hematologia, Quimica, etc.)
- Requisitos especiales por examen (ayuno, muestra, etc.)
- Configuracion de precios por sede
- Activacion/desactivacion de servicios
- Parametros de referencia por examen

### 8. PORTAL DEL PACIENTE

- Dashboard personalizado con proximas citas
- Historial de cotizaciones y pagos
- Acceso a resultados de examenes anteriores
- Gestion de perfil y datos personales
- Notificaciones de citas y resultados
- Descarga de comprobantes y resultados en PDF

### 9. PANEL DE ADMINISTRACION

- Dashboard con metricas y estadisticas en tiempo real
- Gestion centralizada de todos los modulos
- Configuracion del sistema (horarios, sedes, parametros)
- Gestion de usuarios y asignacion de roles
- Monitoreo de actividad del chatbot
- Visualizacion de logs y auditoria

### 10. SISTEMA DE NOTIFICACIONES

- Notificaciones en tiempo real via WebSockets
- Correos electronicos automaticos
- Alertas de stock bajo
- Recordatorios de citas
- Avisos de resultados disponibles
- Notificaciones push en el navegador

---

## GUION DETALLADO - FLUJO DEL SISTEMA

### Flujo del Paciente

1. **Registro e Inicio de Sesion**
   - El paciente accede al sistema web y se registra proporcionando sus datos personales (nombre, cedula, correo, telefono)
   - El sistema valida la cedula de identidad y crea la cuenta
   - El paciente recibe un correo de bienvenida con sus credenciales
   - Al iniciar sesion, accede a su portal personalizado

2. **Solicitud de Examenes via Web**
   - El paciente navega al catalogo de servicios disponibles
   - Selecciona los examenes que necesita realizar
   - El sistema muestra los requisitos (ayuno, tipo de muestra, etc.)
   - Se genera una cotizacion con el detalle y precio total
   - El paciente puede pagar en linea o elegir pago en ventanilla

3. **Agendamiento de Cita**
   - Una vez generada la cotizacion, el paciente selecciona la sede de preferencia
   - El sistema muestra los horarios disponibles segun la configuracion
   - El paciente elige fecha y hora que le convenga
   - Se registra la cita y el paciente debe confirmar su asistencia
   - Si ya pago en linea, la cita queda confirmada automaticamente

4. **Solicitud de Examenes via Chatbot**
   - El paciente interactua con el chatbot por WhatsApp o web
   - Mediante lenguaje natural indica que examenes necesita
   - El chatbot consulta disponibilidad y ofrece horarios
   - El paciente confirma la cita conversando
   - Recibe confirmacion y recordatorios automaticos

5. **Atencion en el Laboratorio**
   - El paciente llega al laboratorio en la fecha/hora agendada
   - Si eligio pago en ventanilla, realiza el pago
   - El personal verifica la identidad y los examenes solicitados
   - Se toma la muestra segun los protocolos establecidos
   - El paciente recibe un comprobante de atencion

6. **Recepcion de Resultados**
   - El laboratorista procesa las muestras y registra los resultados
   - Un supervisor valida los resultados antes de liberarlos
   - El paciente recibe notificacion cuando sus resultados estan listos
   - Accede al portal y descarga el PDF con los resultados
   - Puede consultar su historial completo de examenes anteriores

### Flujo del Administrador

1. **Gestion de Agenda Diaria**
   - El administrador accede al panel y ve las citas del dia
   - Solo aparecen citas confirmadas por el paciente o pagadas
   - Puede ver el detalle de cada cita (paciente, examenes, estado de pago)
   - Marca las citas como atendidas conforme llegan los pacientes

2. **Registro de Resultados**
   - El laboratorista accede al modulo de resultados
   - Selecciona la cita y registra los valores de cada examen
   - Puede adjuntar imagenes o archivos complementarios
   - Los resultados quedan en estado "pendiente de validacion"

3. **Validacion y Liberacion**
   - El supervisor revisa los resultados pendientes
   - Valida que los valores esten dentro de parametros
   - Libera los resultados para que el paciente pueda verlos
   - El sistema envia notificacion automatica al paciente

4. **Gestion de Inventario**
   - El administrador monitorea el stock de reactivos e insumos
   - El sistema alerta automaticamente cuando hay stock bajo
   - Genera ordenes de compra a proveedores registrados
   - Registra las entradas de mercaderia al recibir pedidos

5. **Configuracion del Sistema**
   - Define horarios de atencion por sede
   - Configura feriados y dias no laborables
   - Administra usuarios y asigna permisos
   - Personaliza parametros del chatbot

---

## STACK TECNOLOGICO

### Backend (API REST)

| Tecnologia | Version | Descripcion |
|------------|---------|-------------|
| **NestJS** | 10.x | Framework de Node.js para APIs escalables y mantenibles |
| **TypeScript** | 5.x | Lenguaje con tipado estatico para mayor robustez |
| **Prisma ORM** | 5.x | ORM moderno con migraciones y cliente tipado |
| **Passport JWT** | 10.x | Autenticacion basada en tokens JWT |
| **Socket.IO** | 4.x | Comunicacion en tiempo real bidireccional |
| **Google Dialogflow** | 7.x | Motor de NLP para el chatbot inteligente |
| **AWS S3** | 3.x | Almacenamiento de archivos en la nube |
| **BullMQ** | 5.x | Sistema de colas para tareas asincronas |
| **Helmet** | 8.x | Seguridad HTTP con headers apropiados |
| **Swagger** | 8.x | Documentacion automatica de la API |
| **Jest** | 29.x | Framework de testing unitario y e2e |
| **Class Validator** | 0.14 | Validacion de DTOs y datos de entrada |

### Frontend (Aplicacion Web)

| Tecnologia | Version | Descripcion |
|------------|---------|-------------|
| **Next.js** | 14.x | Framework React con SSR y optimizaciones |
| **React** | 18.x | Biblioteca para interfaces de usuario reactivas |
| **TypeScript** | 5.x | Tipado estatico para mayor mantenibilidad |
| **TailwindCSS** | 3.x | Framework CSS utility-first para estilos rapidos |
| **Radix UI** | 1.x | Componentes accesibles y sin estilos predefinidos |
| **Zustand** | 4.x | Gestion de estado global ligera y simple |
| **React Hook Form** | 7.x | Manejo eficiente de formularios |
| **Zod** | 3.x | Validacion de esquemas con TypeScript |
| **Socket.IO Client** | 4.x | Cliente para conexiones en tiempo real |
| **Lucide React** | 0.3 | Iconos modernos y personalizables |
| **date-fns** | 3.x | Utilidades para manejo de fechas |

### Base de Datos

| Tecnologia | Version | Descripcion |
|------------|---------|-------------|
| **PostgreSQL** | 15.x | Base de datos relacional robusta y escalable |

#### Arquitectura Multi-Schema

El sistema utiliza una arquitectura de schemas separados para organizar las tablas:

```
PostgreSQL Database
├── usuarios          # Gestion de usuarios, roles y permisos
│   ├── Usuario
│   ├── Rol
│   ├── Permiso
│   └── IntentoLogin
│
├── catalogo          # Catalogo de servicios y sedes
│   ├── Servicio
│   ├── Sede
│   ├── ServicioSede
│   └── Feriado
│
├── agenda            # Gestion de citas y disponibilidad
│   ├── Cita
│   ├── SlotDisponibilidad
│   ├── CitaServicio
│   └── Horario
│
├── pagos             # Cotizaciones y transacciones
│   ├── Cotizacion
│   ├── DetalleCotizacion
│   ├── Pago
│   └── MetodoPago
│
├── resultados        # Resultados de examenes
│   ├── Resultado
│   ├── DetalleResultado
│   ├── ArchivoAdjunto
│   └── ValorReferencia
│
├── inventario        # Stock y proveedores
│   ├── Producto
│   ├── Categoria
│   ├── Proveedor
│   ├── OrdenCompra
│   ├── MovimientoInventario
│   └── Stock
│
└── auditoria         # Logs y trazabilidad
    ├── LogAcceso
    ├── LogActividad
    └── LogError
```

### Infraestructura y DevOps

| Tecnologia | Descripcion |
|------------|-------------|
| **Docker** | Contenedorizacion de servicios |
| **Git** | Control de versiones |
| **GitHub Actions** | CI/CD automatizado |
| **AWS S3** | Almacenamiento de archivos |
| **Redis** | Cache y colas de mensajes |

---

## CARACTERISTICAS TECNICAS DESTACADAS

### Seguridad
- Autenticacion JWT con tokens de acceso y refresco
- Encriptacion de contraseñas con bcrypt
- Proteccion contra ataques de fuerza bruta
- Headers de seguridad HTTP (Helmet)
- Rate limiting para prevencion de DoS
- Validacion estricta de datos de entrada

### Escalabilidad
- Arquitectura modular con separacion de responsabilidades
- Base de datos con schemas separados
- Sistema de colas para tareas pesadas
- Cache para consultas frecuentes
- WebSockets para actualizaciones en tiempo real

### Experiencia de Usuario
- Interfaz responsive para movil y escritorio
- Chatbot con IA para atencion automatizada
- Notificaciones en tiempo real
- Carga rapida con Next.js SSR
- Componentes accesibles (WCAG 2.1)

### Mantenibilidad
- Codigo 100% TypeScript
- Tests unitarios y de integracion
- Documentacion API con Swagger
- Migraciones de base de datos con Prisma
- Logs estructurados para debugging

---

## RESUMEN EJECUTIVO

El Sistema Web de Laboratorio Clinico Franz representa una solucion tecnologica moderna y completa que digitaliza todos los procesos de un laboratorio de analisis clinicos. Con una arquitectura robusta basada en NestJS y Next.js, ofrece:

- **Para Pacientes**: Portal intuitivo para agendar citas, pagar en linea, consultar resultados y chatear con IA las 24 horas.

- **Para Administradores**: Panel completo para gestionar agenda, resultados, inventario, usuarios y configuracion del sistema.

- **Para el Negocio**: Automatizacion de procesos, reduccion de errores, mejor atencion al cliente y datos para toma de decisiones.

El sistema esta diseñado para crecer con el laboratorio, permitiendo agregar nuevas sedes, servicios y funcionalidades sin comprometer el rendimiento ni la estabilidad.
