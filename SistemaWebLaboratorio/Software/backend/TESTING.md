# Guía de Pruebas - Sistema de Laboratorio Franz

Este documento explica cómo ejecutar y entender las pruebas automatizadas del sistema.

## 📋 Tipos de Pruebas

### 1. **Pruebas Unitarias**
Prueban componentes individuales de forma aislada (servicios, controladores, etc.)

**Archivos:** `*.spec.ts` en la carpeta `src/`

**Qué cubren:**
- Servicio de autenticación (login, registro, refresh token, logout)
- Servicio de usuarios (búsqueda por ID, cédula, email)
- Validaciones de datos
- Manejo de errores

### 2. **Pruebas de Integración (E2E)**
Prueban el flujo completo de la aplicación, desde la petición HTTP hasta la respuesta

**Archivos:** `*.e2e-spec.ts` en la carpeta `test/`

**Qué cubren:**
- Endpoints de autenticación completos
- Registro de usuarios
- Login con email y cédula
- Refresh de tokens
- Logout
- Acceso a perfil de usuario
- Validaciones de seguridad

## 🚀 Cómo Ejecutar las Pruebas

### Pruebas Unitarias

```bash
# Ejecutar todas las pruebas unitarias una vez
npm test

# Ejecutar en modo watch (se re-ejecutan al guardar cambios)
npm run test:watch

# Ejecutar con cobertura de código
npm run test:cov
```

### Pruebas de Integración (E2E)

```bash
# Ejecutar todas las pruebas e2e
npm run test:e2e

# Ejecutar en modo watch
npm run test:e2e:watch
```

### Todas las Pruebas

```bash
# Ejecutar todas las pruebas (unitarias + e2e)
npm run test:all
```

## ✅ Resultados Esperados

### Pruebas Unitarias - AuthService
- ✓ Registro exitoso de nuevos usuarios
- ✓ Validación de duplicados (email y cédula)
- ✓ Login con credenciales válidas
- ✓ Bloqueo de cuenta después de 5 intentos fallidos
- ✓ Validación de cuentas bloqueadas/inactivas
- ✓ Refresh de tokens correctamente
- ✓ Logout y revocación de tokens

### Pruebas Unitarias - UsersService
- ✓ Búsqueda de usuarios por ID
- ✓ Búsqueda de usuarios por cédula
- ✓ Búsqueda de usuarios por email
- ✓ Manejo correcto de usuarios no encontrados

### Pruebas E2E - Autenticación
- ✓ Registro completo de usuario con validaciones
- ✓ Login con email y cédula
- ✓ Validación de credenciales incorrectas
- ✓ Refresh de tokens
- ✓ Logout y limpieza de sesiones
- ✓ Acceso a perfil autenticado
- ✓ Protección de rutas privadas

## 📊 Cobertura de Código

Al ejecutar `npm run test:cov`, se genera un reporte de cobertura en la carpeta `coverage/`.

**Métricas importantes:**
- **Statements:** % de líneas ejecutadas
- **Branches:** % de condiciones probadas
- **Functions:** % de funciones ejecutadas
- **Lines:** % de líneas de código probadas

**Objetivo:** Mantener al menos 80% de cobertura en módulos críticos (auth, users).

## 🔍 Interpretar los Resultados

### ✅ Prueba Exitosa
```
PASS  src/modules/auth/services/auth.service.spec.ts
  AuthService
    ✓ should be defined (5 ms)
    ✓ should register a new patient successfully (12 ms)
    ✓ should login successfully (8 ms)
```

### ❌ Prueba Fallida
```
FAIL  src/modules/auth/services/auth.service.spec.ts
  AuthService
    ✕ should register a new patient successfully (15 ms)

  Expected: 201
  Received: 400
```

## 🛡️ Seguridad de las Pruebas

**IMPORTANTE:** Las pruebas están diseñadas para:

1. **No afectar datos reales:**
   - Las pruebas E2E usan datos de test con prefijo "test-e2e"
   - Se limpian automáticamente después de ejecutarse

2. **Ser independientes:**
   - Cada prueba se ejecuta en aislamiento
   - No dependen del orden de ejecución

3. **Ser repetibles:**
   - Puedes ejecutarlas cuantas veces quieras
   - Siempre producen los mismos resultados

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
# Regenerar dependencias
npm install
```

### Error: "Database connection failed" (E2E)
```bash
# Asegúrate de que la base de datos está corriendo
# Verifica tu archivo .env
```

### Pruebas muy lentas
```bash
# Ejecuta solo un archivo específico
npm test -- auth.service.spec.ts
```

### Limpiar caché de Jest
```bash
npm test -- --clearCache
```

## 📝 Agregar Nuevas Pruebas

### Ejemplo de prueba unitaria:

```typescript
describe('MiServicio', () => {
  it('should do something', async () => {
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Ejemplo de prueba E2E:

```typescript
it('should handle POST request', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/endpoint')
    .send({ data: 'test' })
    .expect(201);

  expect(response.body).toHaveProperty('id');
});
```

## 💡 Mejores Prácticas

1. **Ejecuta las pruebas antes de hacer commit**
2. **Escribe pruebas para nuevas funcionalidades**
3. **Mantén las pruebas simples y enfocadas**
4. **Usa nombres descriptivos para las pruebas**
5. **No dejes pruebas comentadas o deshabilitadas**

## 📚 Recursos Adicionales

- [Documentación de Jest](https://jestjs.io/)
- [Documentación de Testing en NestJS](https://docs.nestjs.com/fundamentals/testing)
- [Supertest para pruebas HTTP](https://github.com/visionmedia/supertest)

---

**Nota:** Estas pruebas son solo el comienzo. A medida que el sistema crece, deberías agregar más pruebas para cubrir nuevos módulos y funcionalidades.
