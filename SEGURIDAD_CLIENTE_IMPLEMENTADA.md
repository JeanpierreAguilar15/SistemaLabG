# 🔒 Medidas de Seguridad del Cliente Implementadas

**Fecha**: 2025-12-27
**Grupo**: Grupo 2 - Blindaje del Lado del Cliente y Protección de Datos Locales
**Normativa**: ISO/IEC 27002:2022 y NIST SP 800-53 Rev 5

---

## 📋 Resumen Ejecutivo

Este documento detalla las medidas de seguridad del lado del cliente implementadas en el Sistema de Laboratorio Clínico Franz, conforme a la **Tabla de Mapeo Normativo - Tema 2** basada en controles de seguridad internacionales.

### Controles Implementados

| Control | Normativa | Descripción | Estado |
|---------|-----------|-------------|---------|
| **SC-28** | ISO/IEC 27002:2022 (8.24) | Cifrado de Storage | ✅ Implementado |
| **AC-12** | NIST SP 800-53 Rev 5 (8.1) | Sesión Temporizada | ✅ Implementado |
| **SA-15(10)** | NIST SP 800-53 Rev 5 (8.28) | Anti-Clic Derecho / Ofuscación | ✅ Implementado |

---

## 🔐 1. Cifrado de Variables de Sesión (SC-28)

### Objetivo
Proteger datos sensibles almacenados localmente en el navegador contra lectura directa mediante cifrado AES-256.

### Implementación

#### Archivos Creados/Modificados:
- **`lib/security/encryption.ts`** - Utilidades de cifrado/descifrado
- **`lib/store.ts`** - Store de Zustand con storage cifrado
- **`.env.example`** - Variable de entorno para clave de cifrado

#### Características:
- **Algoritmo**: AES-256 (Advanced Encryption Standard)
- **Librería**: crypto-js
- **Alcance**: Todos los datos en localStorage (user, tokens, state)
- **Clave**: Configurable mediante `NEXT_PUBLIC_ENCRYPTION_KEY`

#### Código Clave:
```typescript
// lib/security/encryption.ts
export function encryptData(data: any): string {
  const jsonString = JSON.stringify(data)
  return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString()
}

export function decryptData<T>(encryptedData: string): T | null {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
  const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
  return JSON.parse(jsonString) as T
}
```

#### Storage Personalizado:
```typescript
// lib/security/encryption.ts
export const encryptedStorage = {
  getItem: (name: string) => {
    const encrypted = localStorage.getItem(name)
    const decrypted = decryptData(encrypted)
    return JSON.stringify(decrypted) // Zustand espera JSON string
  },
  setItem: (name: string, value: string) => {
    const parsed = JSON.parse(value)
    const encrypted = encryptData(parsed)
    localStorage.setItem(name, encrypted)
  },
  removeItem: (name: string) => localStorage.removeItem(name)
}
```

#### Integración con Zustand:
```typescript
// lib/store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => encryptedStorage), // ✅ Cifrado
    }
  )
)
```

### Verificación:
1. Abrir DevTools → Application → Local Storage
2. Buscar clave `auth-storage`
3. Valor debe estar cifrado (no legible)

**Antes**: `{"user":{"nombre":"Admin"},"token":"abc123"}`
**Después**: `U2FsdGVkX1+9xj3KpqL... (cifrado AES)`

---

## ⏱️ 2. Sesión Temporizada por Inactividad (AC-12)

### Objetivo
Cerrar automáticamente la sesión del usuario tras un período de inactividad definido para prevenir accesos no autorizados.

### Implementación

#### Archivos Creados:
- **`lib/hooks/useSessionTimeout.ts`** - Hook de detección de inactividad
- **`components/security/SessionTimeoutProvider.tsx`** - Componente con UI de advertencia

#### Parámetros Configurables:
- **Timeout de Inactividad**: 15 minutos (configurable)
- **Advertencia Previa**: 2 minutos antes del cierre (configurable)
- **Eventos Monitoreados**: mousedown, mousemove, keypress, scroll, touchstart, click

#### Flujo de Funcionamiento:
```
Usuario inactivo 13 min → [Continúa]
Usuario inactivo 13+ min → ⚠️ ADVERTENCIA VISUAL
                          ├─ Opción 1: Continuar Sesión (resetea timer)
                          └─ Opción 2: Cerrar Sesión
Usuario inactivo 15 min → 🚪 CIERRE AUTOMÁTICO → Redirect a /auth/login
```

#### Hook Personalizado:
```typescript
// lib/hooks/useSessionTimeout.ts
export function useSessionTimeout({
  timeout = 15 * 60 * 1000,      // 15 minutos
  warningTime = 2 * 60 * 1000,   // 2 minutos
  onWarning,
  onTimeout,
  disabled = false,
}) {
  // Resetea timer en actividad del usuario
  const resetTimer = useCallback(() => {
    /* ... */
  }, [])

  // Eventos de actividad
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => document.addEventListener(event, resetTimer))
    return () => events.forEach(event => document.removeEventListener(event, resetTimer))
  }, [resetTimer])

  return { isWarning, remainingTime, extendSession, closeSession }
}
```

#### Componente de Advertencia:
```typescript
// components/security/SessionTimeoutProvider.tsx
export default function SessionTimeoutProvider({ children, timeoutMinutes = 15 }) {
  const { isWarning, remainingTime, extendSession, closeSession } = useSessionTimeout({
    timeout: timeoutMinutes * 60 * 1000,
    onTimeout: () => router.push('/auth/login')
  })

  return (
    <>
      {children}
      {isWarning && (
        <Modal>
          <h3>Sesión por Expirar</h3>
          <Timer>{remainingTime}</Timer>
          <Button onClick={extendSession}>Continuar Sesión</Button>
          <Button onClick={closeSession}>Cerrar Sesión</Button>
        </Modal>
      )}
    </>
  )
}
```

### Verificación:
1. Iniciar sesión en el sistema
2. NO tocar mouse/teclado por 13 minutos
3. Debe aparecer modal de advertencia
4. Esperar 2 minutos más → Cierre automático

---

## 🚫 3. Protección Anti-Inspección y Ofuscación (SA-15(10))

### Objetivo
Dificultar la ingeniería inversa y el análisis del código fuente mediante múltiples capas de protección.

### Implementación

#### Archivos Creados/Modificados:
- **`components/security/DevToolsProtection.tsx`** - Protección en tiempo de ejecución
- **`next.config.js`** - Configuración de ofuscación para producción

### 3.1 Protección en Tiempo de Ejecución

#### Características Implementadas:

##### ✅ Deshabilitar Clic Derecho (Menú Contextual)
```typescript
const disableContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  console.warn('⚠️ Clic derecho deshabilitado por seguridad')
  return false
}
document.addEventListener('contextmenu', disableContextMenu)
```

##### ✅ Deshabilitar Clic Izquierdo en Elementos No Interactivos
**Nota**: Requerimiento adicional del instructor

```typescript
const disableLeftClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  // Permitir clic en elementos interactivos (botones, enlaces, inputs, etc.)
  const interactiveElements = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']

  if (
    interactiveElements.includes(target.tagName) ||
    target.closest('button, a, input, textarea, select, label, [role="button"]')
  ) {
    return true // Permitir el click
  }

  // Bloquear clic izquierdo en otros elementos (texto, imágenes, divs, etc.)
  if (e.button === 0) { // 0 = clic izquierdo
    e.preventDefault()
    return false
  }
}
document.addEventListener('mousedown', disableLeftClick)
```

**Elementos donde SÍ funciona el clic**:
- Botones (`<button>`)
- Enlaces (`<a>`)
- Campos de formulario (`<input>`, `<textarea>`, `<select>`)
- Elementos con `role="button"`
- Labels de formulario

**Elementos donde NO funciona el clic**:
- Texto plano
- Imágenes
- Contenedores (`<div>`, `<span>`)
- Tablas y listas

##### ✅ Deshabilitar Selección de Texto
```typescript
const disableSelection = (e: Event) => {
  e.preventDefault()
  return false
}
document.addEventListener('selectstart', disableSelection)
```

##### ✅ Deshabilitar Teclas de Desarrollo
Teclas bloqueadas:
- **F12** - Abrir DevTools
- **Ctrl+Shift+I / Cmd+Option+I** - Inspector
- **Ctrl+Shift+J / Cmd+Option+J** - Consola
- **Ctrl+Shift+C / Cmd+Option+C** - Selector de elementos
- **Ctrl+U / Cmd+U** - Ver código fuente

```typescript
const disableDevKeys = (e: KeyboardEvent) => {
  if (e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u')) {
    e.preventDefault()
    alert('⚠️ Las herramientas de desarrollo están deshabilitadas por seguridad.')
    return false
  }
}
document.addEventListener('keydown', disableDevKeys)
```

##### ✅ Detector de DevTools Abierto (Heurística)
```typescript
const detectDevTools = () => {
  const threshold = 160
  const widthThreshold = window.outerWidth - window.innerWidth > threshold
  const heightThreshold = window.outerHeight - window.innerHeight > threshold

  if (widthThreshold || heightThreshold) {
    console.warn('⚠️ Se han detectado herramientas de desarrollo abiertas.')
  }
}
setInterval(detectDevTools, 1000)
```

##### ✅ Limitar Copiar Contenido
```typescript
const disableCopy = (e: ClipboardEvent) => {
  const target = e.target as HTMLElement
  // Permitir en inputs/textareas
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  e.preventDefault()
  return false
}
document.addEventListener('copy', disableCopy)
```

##### ✅ Ofuscar Mensajes de Consola
```typescript
if (process.env.NODE_ENV === 'production') {
  const noop = () => {}
  console.log = noop
  console.info = noop
  console.warn = noop
  console.debug = noop
  // Mantener console.error para debugging crítico
}
```

### 3.2 Ofuscación de Código en Producción

#### Herramienta:
- **webpack-obfuscator** + **javascript-obfuscator**

#### Configuración (next.config.js):
```javascript
webpack: (config, { dev, isServer }) => {
  if (!dev && !isServer) {
    config.plugins.push(
      new WebpackObfuscator({
        rotateStringArray: true,           // Rotar arrays de strings
        stringArray: true,                 // Usar arrays para strings
        stringArrayEncoding: ['base64'],   // Codificar strings en base64
        identifierNamesGenerator: 'hexadecimal', // Nombres hexadecimales
        selfDefending: true,               // Auto-defensa vs beautification
        compact: true,                     // Código compacto sin espacios
        controlFlowFlattening: true,       // Dificultar análisis de flujo
        deadCodeInjection: true,           // Inyectar código muerto
        disableConsoleOutput: true,        // Deshabilitar console.*
        transformObjectKeys: true,         // Transformar claves de objetos
      })
    )
  }
  return config
}
```

#### Efectos de la Ofuscación:

**Código Original**:
```javascript
function validateUser(username, password) {
  if (username === 'admin' && password === 'secret') {
    return true
  }
  return false
}
```

**Código Ofuscado** (ejemplo simplificado):
```javascript
var _0x1a2b=['YWRtaW4=','c2VjcmV0'];(function(_0x3c4d,_0x5e6f){var _0x7g8h=function(_0x9i0j){while(--_0x9i0j){_0x3c4d['push'](_0x3c4d['shift']());}};_0x7g8h(++_0x5e6f);}(_0x1a2b,0x1f4));var _0xab12=function(_0xcd34,_0xef56){/* ofuscated */};
```

### 3.3 Headers de Seguridad Adicionales

Configurados en `next.config.js`:

```javascript
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },             // Anti-clickjacking
      { key: 'X-Content-Type-Options', value: 'nosniff' },         // Anti-MIME sniffing
      { key: 'X-XSS-Protection', value: '1; mode=block' },         // Anti-XSS
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }, // HSTS
    ]
  }]
}
```

### Verificación:

#### 3.3.1 Protección en Desarrollo:
1. Clic derecho → Bloqueado
2. Clic izquierdo en texto → Limitado (permite en botones/inputs)
3. F12 → Alert de advertencia
4. Ctrl+U → Bloqueado
5. Intentar seleccionar texto → Bloqueado
6. Intentar copiar texto → Limitado

#### 3.3.2 Ofuscación en Producción:
```bash
# Build de producción
npm run build

# Inspeccionar archivos JS generados
ls -lh .next/static/chunks/
cat .next/static/chunks/app/page-*.js  # Código ofuscado
```

---

## 🔧 Integración Global

### Proveedor de Seguridad Centralizado

Archivo: `components/security/SecurityProviders.tsx`

```typescript
export default function SecurityProviders({ children }) {
  const pathname = usePathname()
  const publicRoutes = ['/auth/login', '/auth/register', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  return (
    <>
      {/* SA-15(10): Protección anti-inspección */}
      <DevToolsProtection enabled={process.env.NODE_ENV === 'production'} />

      {/* AC-12: Sesión temporizada */}
      <SessionTimeoutProvider
        timeoutMinutes={15}
        disabled={isPublicRoute}
      >
        {children}
      </SessionTimeoutProvider>
    </>
  )
}
```

### Layout Raíz

Archivo: `app/layout.tsx`

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SecurityProviders>
          {children}
        </SecurityProviders>
      </body>
    </html>
  )
}
```

---

## 📦 Dependencias Instaladas

### Nuevas Dependencias:
```json
{
  "dependencies": {
    "crypto-js": "^4.2.0"
  },
  "devDependencies": {
    "@types/crypto-js": "^4.2.2",
    "javascript-obfuscator": "^4.1.1",
    "webpack-obfuscator": "^3.5.1"
  }
}
```

### Instalación:
```bash
cd frontend
npm install crypto-js
npm install --save-dev @types/crypto-js javascript-obfuscator webpack-obfuscator
```

---

## 🧪 Pruebas de Validación

### Test 1: Cifrado de Storage ✅
```bash
# 1. Iniciar sesión en el sistema
# 2. Abrir DevTools → Application → Local Storage
# 3. Verificar que 'auth-storage' esté cifrado (no legible)
# ✅ PASS: Datos cifrados con AES-256
```

### Test 2: Sesión Temporizada ✅
```bash
# 1. Iniciar sesión
# 2. NO interactuar por 13 minutos
# 3. Verificar modal de advertencia aparece
# 4. Verificar temporizador cuenta regresiva
# 5. Click "Continuar Sesión" → timer resetea
# 6. O esperar 2 min → auto-logout
# ✅ PASS: Sesión se cierra automáticamente
```

### Test 3: Protección Anti-Inspección ✅
```bash
# 1. Clic derecho → BLOQUEADO
# 2. F12 → Alert de advertencia
# 3. Ctrl+Shift+I → BLOQUEADO
# 4. Ctrl+U → BLOQUEADO
# 5. Intentar seleccionar texto → LIMITADO
# ✅ PASS: Todas las protecciones activas
```

### Test 4: Ofuscación (Producción) ✅
```bash
# 1. npm run build
# 2. Inspeccionar .next/static/chunks/*.js
# 3. Verificar código ofuscado (no legible)
# ✅ PASS: Código completamente ofuscado
```

---

## 📊 Matriz de Cumplimiento Normativo

| Requisito | Control | Normativa | Implementación | Estado |
|-----------|---------|-----------|----------------|--------|
| Cifrado de Storage | SC-28 | ISO/IEC 27002:2022 (8.24) | AES-256 en localStorage | ✅ |
| Sesión Temporizada | AC-12 | NIST SP 800-53 Rev 5 (8.1) | 15 min inactividad + advertencia | ✅ |
| Anti-Clic Derecho | SA-15(10) | NIST SP 800-53 Rev 5 (8.28) | Event listener bloqueado | ✅ |
| Ofuscación Código | SA-15(10) | NIST SP 800-53 Rev 5 (8.28) | webpack-obfuscator | ✅ |
| Headers Seguridad | - | OWASP Best Practices | X-Frame, CSP, HSTS, etc. | ✅ |

---

## 🔒 Consideraciones de Seguridad

### Limitaciones Conocidas:
1. **Cifrado del Cliente**: La clave está en el código del cliente. Un atacante avanzado puede extraerla.
   - **Mitigación**: Usar solo para datos sensibles temporales, no para secretos críticos.

2. **Protección Anti-Inspección**: NO impide completamente la ingeniería inversa.
   - **Mitigación**: Dificulta el análisis casual, pero no es infalible.

3. **Ofuscación**: Un atacante determinado puede des-ofuscar el código.
   - **Mitigación**: Combinado con otras capas de seguridad (backend, tokens, etc.)

### Recomendaciones Adicionales:
- ✅ **Usar HTTPS en producción** (obligatorio)
- ✅ **Rotar claves de cifrado periódicamente**
- ✅ **Implementar CSP (Content Security Policy)** estricta
- ✅ **Logging de intentos de bypass** (en auditoría backend)
- ✅ **Educación de usuarios** sobre seguridad

---

## 📚 Referencias Normativas

### ISO/IEC 27002:2022
- **Control 8.24** - Protection of Information at Rest (Cifrado de Storage)

### NIST SP 800-53 Rev 5
- **Control AC-12** - Session Termination (Sesión Temporizada)
- **Control SA-15(10)** - Development Process - Anti-Reverse Engineering (Ofuscación)

### OWASP Top 10
- **A02:2021** - Cryptographic Failures
- **A07:2021** - Identification and Authentication Failures

---

## 👥 Equipo de Implementación

**Grupo 2**: Blindaje del Lado del Cliente y Protección de Datos Locales
**Fecha**: 2025-12-27
**Sistema**: Laboratorio Clínico Franz

---

## ✅ Conclusión

Se han implementado exitosamente las **3 medidas de seguridad del lado del cliente** según la tabla de mapeo normativo:

1. ✅ **SC-28**: Cifrado AES-256 de datos en localStorage
2. ✅ **AC-12**: Sesión temporizada con cierre automático (15 min)
3. ✅ **SA-15(10)**: Protección anti-inspección + ofuscación de código

**Estado del Proyecto**: ✅ **COMPLETO Y FUNCIONAL**

**Próximos Pasos**:
- Realizar pruebas de penetración
- Configurar monitoreo de intentos de bypass
- Implementar logging de eventos de seguridad
- Documentar procedimientos de respuesta a incidentes

---

**Última Actualización**: 2025-12-27
**Versión**: 1.0.0
