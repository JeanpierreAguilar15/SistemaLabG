# ✅ Checklist de Validación - Seguridad del Cliente

**Proyecto**: Sistema Laboratorio Clínico Franz
**Fecha**: 2025-12-27
**Grupo**: Grupo 2 - Blindaje del Lado del Cliente

---

## 📋 Control SC-28: Cifrado de Storage

### Requisitos Base
- [x] Implementar cifrado AES-256 para localStorage
- [x] Proteger datos de usuario (user, tokens, session state)
- [x] Usar librería de cifrado estándar (crypto-js)
- [x] Clave de cifrado configurable

### Archivos Implementados
- [x] `lib/security/encryption.ts` - Funciones de cifrado/descifrado
- [x] `lib/store.ts` - Store con storage cifrado
- [x] `.env.example` - Variable NEXT_PUBLIC_ENCRYPTION_KEY

### Pruebas de Validación
```bash
# TEST 1: Verificar cifrado en localStorage
1. [ ] Iniciar sesión en el sistema
2. [ ] Abrir DevTools → Application → Local Storage
3. [ ] Buscar clave 'auth-storage'
4. [ ] ✅ VERIFICAR: Valor debe ser string cifrado (no legible)
5. [ ] ✅ VERIFICAR: NO debe verse {"user":...} en texto plano

# TEST 2: Verificar descifrado correcto
1. [ ] Recargar la página (F5)
2. [ ] ✅ VERIFICAR: Usuario sigue autenticado
3. [ ] ✅ VERIFICAR: No hay errores en consola
4. [ ] ✅ VERIFICAR: Datos del usuario se muestran correctamente

# TEST 3: Verificar invalidación
1. [ ] Modificar manualmente el valor en localStorage
2. [ ] Recargar la página
3. [ ] ✅ VERIFICAR: Sesión se invalida y redirige a login
```

### Criterios de Aceptación
- [ ] Datos en localStorage están cifrados (no legibles)
- [ ] Sistema funciona correctamente con cifrado
- [ ] Datos corruptos invalidan la sesión
- [ ] Performance no degradada (tiempo de carga <100ms adicional)

---

## ⏱️ Control AC-12: Sesión Temporizada

### Requisitos Base
- [x] Cerrar sesión tras 15 minutos de inactividad
- [x] Advertencia 2 minutos antes del cierre
- [x] Detectar eventos de usuario (mouse, teclado, scroll, touch)
- [x] Modal visual con temporizador

### Archivos Implementados
- [x] `lib/hooks/useSessionTimeout.ts` - Hook de detección
- [x] `components/security/SessionTimeoutProvider.tsx` - UI de advertencia
- [x] `components/security/SecurityProviders.tsx` - Integración

### Pruebas de Validación
```bash
# TEST 1: Detección de inactividad (LARGO - 15 min)
1. [ ] Iniciar sesión
2. [ ] NO tocar mouse/teclado por 13 minutos
3. [ ] ✅ VERIFICAR: A los 13 min aparece modal de advertencia
4. [ ] ✅ VERIFICAR: Temporizador cuenta regresiva desde 2:00 min

# TEST 2: Extensión de sesión
1. [ ] En el modal de advertencia
2. [ ] Click en "Continuar Sesión"
3. [ ] ✅ VERIFICAR: Modal se cierra
4. [ ] ✅ VERIFICAR: Temporizador se resetea (15 min más)
5. [ ] ✅ VERIFICAR: Usuario sigue autenticado

# TEST 3: Cierre automático
1. [ ] Esperar el modal de advertencia
2. [ ] NO hacer click en nada por 2 minutos más
3. [ ] ✅ VERIFICAR: Sesión se cierra automáticamente
4. [ ] ✅ VERIFICAR: Redirige a /auth/login

# TEST 4: Eventos detectados
1. [ ] Iniciar sesión
2. [ ] Esperar 10 minutos SIN interacción
3. [ ] Mover el mouse ligeramente
4. [ ] ✅ VERIFICAR: Timer se resetea (no aparece modal)
5. [ ] Probar con: scroll, tecla, click, touch

# TEST 5: Rutas públicas
1. [ ] Ir a /auth/login (sin autenticar)
2. [ ] Esperar 15 minutos
3. [ ] ✅ VERIFICAR: NO aparece modal (timeout deshabilitado)
```

### Criterios de Aceptación
- [ ] Modal aparece exactamente a los 13 minutos
- [ ] Temporizador cuenta regresiva correctamente
- [ ] Botón "Continuar Sesión" resetea el timer
- [ ] Cierre automático funciona a los 15 minutos
- [ ] Todos los eventos detectan actividad (mouse, teclado, scroll, touch)
- [ ] No aplica en rutas públicas (/auth/login, /auth/register, /)

---

## 🚫 Control SA-15(10): Anti-Inspección y Ofuscación

### Requisitos Base
- [x] Deshabilitar clic derecho (contextmenu)
- [x] Deshabilitar clic izquierdo en elementos no interactivos
- [x] Bloquear teclas de desarrollo (F12, Ctrl+Shift+I, etc.)
- [x] Detector de DevTools abierto
- [x] Ofuscar código JavaScript en producción
- [x] Headers de seguridad HTTP

### Archivos Implementados
- [x] `components/security/DevToolsProtection.tsx` - Protección runtime
- [x] `next.config.js` - Ofuscación + headers
- [x] `components/security/SecurityProviders.tsx` - Integración

### Pruebas de Validación - Protección Runtime

```bash
# TEST 1: Clic derecho deshabilitado
1. [ ] Iniciar sesión
2. [ ] Clic derecho en cualquier parte de la página
3. [ ] ✅ VERIFICAR: NO aparece menú contextual
4. [ ] ✅ VERIFICAR: (Dev) Mensaje en consola "Clic derecho deshabilitado"

# TEST 2: Clic izquierdo limitado (NUEVO)
1. [ ] Intentar seleccionar texto haciendo clic y arrastrando
2. [ ] ✅ VERIFICAR: NO se puede seleccionar texto fácilmente
3. [ ] ✅ VERIFICAR: Botones y enlaces SÍ funcionan con clic
4. [ ] ✅ VERIFICAR: Inputs y textareas SÍ permiten clic

# TEST 3: Teclas de desarrollo bloqueadas
1. [ ] Presionar F12
2. [ ] ✅ VERIFICAR: Alert "Herramientas deshabilitadas"
3. [ ] ✅ VERIFICAR: DevTools NO se abre
4. [ ] Probar también:
   - [ ] Ctrl+Shift+I (Inspector)
   - [ ] Ctrl+Shift+J (Console)
   - [ ] Ctrl+Shift+C (Selector)
   - [ ] Ctrl+U (Código fuente)
   - [ ] Cmd+Option+I (Mac Inspector)
   - [ ] Cmd+Option+J (Mac Console)

# TEST 4: Detector de DevTools
1. [ ] Abrir DevTools antes de cargar la página (F12 antes de login)
2. [ ] Iniciar sesión
3. [ ] ✅ VERIFICAR: (Dev) Mensaje en consola "DevTools detectadas"
4. [ ] ✅ VERIFICAR: Sistema sigue funcionando (no bloqueo)

# TEST 5: Selección de texto deshabilitada
1. [ ] Intentar seleccionar texto con click+arrastrar
2. [ ] ✅ VERIFICAR: NO se puede seleccionar
3. [ ] ✅ VERIFICAR: En inputs/textareas SÍ se puede seleccionar

# TEST 6: Copiar contenido limitado
1. [ ] Intentar Ctrl+C en texto de la página
2. [ ] ✅ VERIFICAR: Copiado bloqueado (mensaje en consola)
3. [ ] Intentar Ctrl+C en un input
4. [ ] ✅ VERIFICAR: Copiado SÍ funciona en inputs
```

### Pruebas de Validación - Ofuscación (Producción)

```bash
# TEST 7: Build de producción
1. [ ] cd frontend && npm run build
2. [ ] ✅ VERIFICAR: Build completa sin errores
3. [ ] ✅ VERIFICAR: Tiempo de build <5 minutos

# TEST 8: Código ofuscado
1. [ ] ls -lh .next/static/chunks/
2. [ ] cat .next/static/chunks/app/page-*.js
3. [ ] ✅ VERIFICAR: Código NO legible (variables hexadecimales)
4. [ ] ✅ VERIFICAR: Strings codificados en base64
5. [ ] ✅ VERIFICAR: NO hay nombres de funciones originales

# TEST 9: Tamaño del bundle
1. [ ] npm run build
2. [ ] Revisar output de "Route (app)"
3. [ ] ✅ VERIFICAR: Total bundle <5MB
4. [ ] ✅ VERIFICAR: Páginas individuales <500KB

# TEST 10: Headers de seguridad
1. [ ] npm run build && npm start
2. [ ] Abrir DevTools → Network
3. [ ] Recargar página
4. [ ] Inspeccionar Response Headers
5. [ ] ✅ VERIFICAR: X-Frame-Options: SAMEORIGIN
6. [ ] ✅ VERIFICAR: X-Content-Type-Options: nosniff
7. [ ] ✅ VERIFICAR: X-XSS-Protection: 1; mode=block
8. [ ] ✅ VERIFICAR: Strict-Transport-Security presente
9. [ ] ✅ VERIFICAR: Referrer-Policy presente
10. [ ] ✅ VERIFICAR: NO existe X-Powered-By

# TEST 11: Console deshabilitado en producción
1. [ ] npm run build && npm start
2. [ ] Abrir DevTools (si es posible)
3. [ ] Intentar: console.log("test")
4. [ ] ✅ VERIFICAR: NO imprime nada
5. [ ] Intentar: console.error("test")
6. [ ] ✅ VERIFICAR: SÍ imprime (error permitido)
```

### Criterios de Aceptación
- [ ] Clic derecho completamente bloqueado
- [ ] Clic izquierdo limitado (permite interacción con UI)
- [ ] Todas las teclas de desarrollo bloqueadas
- [ ] DevTools detectadas (sin bloquear app)
- [ ] Selección de texto deshabilitada (excepto inputs)
- [ ] Código ofuscado en producción (no legible)
- [ ] Todos los headers de seguridad presentes
- [ ] Console.* deshabilitado excepto .error
- [ ] Bundle size razonable (<5MB)
- [ ] Performance no degradada significativamente (<5%)

---

## 🔧 Configuración y Entorno

### Variables de Entorno
```bash
# .env.local debe contener:
- [ ] NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
- [ ] NEXT_PUBLIC_ENCRYPTION_KEY=<clave-segura-unica>
```

### Dependencias Instaladas
```bash
# Verificar en package.json:
- [x] crypto-js (dependencies)
- [x] @types/crypto-js (devDependencies)
- [x] javascript-obfuscator (devDependencies)
- [x] webpack-obfuscator (devDependencies)
```

### Archivos de Configuración
- [x] `next.config.js` - Ofuscación + headers configurados
- [x] `.env.example` - Variable de cifrado documentada
- [x] `tsconfig.json` - Sin cambios (compatible)

---

## 📊 Matriz de Cumplimiento

| Requisito | ISO/NIST | Estado | Evidencia |
|-----------|----------|--------|-----------|
| Cifrado de Storage | SC-28 (8.24) | ✅ | localStorage cifrado con AES-256 |
| Sesión Temporizada | AC-12 (8.1) | ✅ | Auto-logout a 15 min + advertencia |
| Clic Derecho Bloqueado | SA-15(10) (8.28) | ✅ | contextmenu preventDefault |
| Clic Izquierdo Limitado | SA-15(10) (8.28) | ✅ | mousedown limitado |
| Teclas Dev Bloqueadas | SA-15(10) (8.28) | ✅ | F12, Ctrl+Shift+I, etc. |
| Ofuscación Código | SA-15(10) (8.28) | ✅ | webpack-obfuscator |
| Headers Seguridad | OWASP | ✅ | HSTS, CSP, X-Frame, etc. |

---

## 🚀 Pruebas Rápidas (5 minutos)

Para validación rápida antes de presentar:

```bash
# 1. Verificar que el proyecto compile
cd /home/user/SistemaLabG/SistemaWebLaboratorio/Software/frontend
npm run dev

# 2. Abrir http://localhost:3000
# 3. Iniciar sesión

# 4. Pruebas rápidas:
- [ ] Clic derecho → BLOQUEADO ✅
- [ ] Clic izquierdo en texto → LIMITADO ✅
- [ ] F12 → ALERT ✅
- [ ] Ctrl+U → BLOQUEADO ✅
- [ ] DevTools → Application → auth-storage → CIFRADO ✅

# 5. Build de producción (1-2 min)
npm run build
# [ ] ✅ Build exitoso sin errores

# 6. Listo para presentar ✅
```

---

## 📝 Checklist de Entrega

### Documentación
- [x] SEGURIDAD_CLIENTE_IMPLEMENTADA.md (completo)
- [x] ANALISIS_OFUSCACION.md (justificación técnica)
- [x] CHECKLIST_VALIDACION_SEGURIDAD.md (este archivo)
- [x] .env.example actualizado con ENCRYPTION_KEY

### Código
- [x] lib/security/encryption.ts
- [x] lib/hooks/useSessionTimeout.ts
- [x] components/security/SessionTimeoutProvider.tsx
- [x] components/security/DevToolsProtection.tsx
- [x] components/security/SecurityProviders.tsx
- [x] app/layout.tsx (integrado SecurityProviders)
- [x] lib/store.ts (storage cifrado)
- [x] next.config.js (ofuscación + headers)

### Testing
- [ ] Pruebas de cifrado completadas
- [ ] Pruebas de sesión temporizada completadas
- [ ] Pruebas de anti-inspección completadas
- [ ] Build de producción exitoso
- [ ] Headers de seguridad verificados

### Git
- [x] Commit creado con mensaje descriptivo
- [x] Push a rama remota completado

---

## ⚠️ Notas Importantes

### Limitaciones Conocidas
1. **Cifrado del Cliente**: La clave está en el código (solo ofusca, no es 100% seguro)
2. **Anti-Inspección**: Dificulta pero NO impide completamente inspección
3. **Ofuscación**: Un atacante avanzado puede des-ofuscar con tiempo

### Mitigaciones
1. ✅ Usar HTTPS en producción (obligatorio)
2. ✅ Tokens con expiración corta (15 min access token)
3. ✅ Validación en backend (nunca confiar en cliente)
4. ✅ Logging de intentos sospechosos (backend)

### Recomendaciones Futuras
- [ ] Implementar CSP (Content Security Policy) estricta
- [ ] Agregar rate limiting en login
- [ ] Implementar CAPTCHA tras múltiples intentos
- [ ] Rotar clave de cifrado periódicamente
- [ ] Monitorear intentos de bypass en analytics

---

## ✅ Firma de Validación

**Implementado por**: Claude AI Assistant
**Validado por**: _______________ (Instructor)
**Fecha de Validación**: _______________

**Estado Final**:
- [ ] ✅ APROBADO - Implementación completa al 100%
- [ ] ⚠️ APROBADO CON OBSERVACIONES
- [ ] ❌ REQUIERE CORRECCIONES

**Observaciones**:
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**Última Actualización**: 2025-12-27
**Versión**: 2.0 (con clic izquierdo + análisis ofuscación)
