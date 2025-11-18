# Diagnóstico de Páginas Admin Vacías

## Problema
Las páginas de admin (Paquetes, Proveedores, Inventario) aparecen vacías (todo en 0) incluso después de ejecutar el seed.

## Verificaciones necesarias

### 1. Verificar que el backend esté corriendo
```bash
# Debería mostrar el proceso de NestJS
ps aux | grep nest
```

### 2. Abrir consola del navegador (F12) y verificar:

#### En la pestaña Console:
- ¿Aparece el log "Paquetes - accessToken: exists mounted: true"?
- ¿Aparece "Loading packages from: http://localhost:3001/admin/packages"?
- ¿Aparece "Packages response status: XXX"?
- ¿Qué status code muestra? (200, 401, 403, 500?)

#### En la pestaña Network:
- Filtrar por "packages", "suppliers", "inventory"
- ¿Aparecen las peticiones HTTP?
- Si aparecen: ¿qué status code tienen?
- Ver la respuesta (Response tab) - ¿qué dice?
- Ver los headers (Headers tab) - ¿se envía Authorization?

### 3. Verificar datos en BD
```bash
cd backend
# Ejecutar seed
npx prisma db seed

# Conectarse a la BD y verificar datos
```

### 4. Testear endpoints directamente
```bash
# 1. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lab.com","password":"admin123"}'
# Copiar el accessToken

# 2. Testear endpoint de paquetes
curl -X GET http://localhost:3001/admin/packages \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 3. Testear endpoint de proveedores
curl -X GET http://localhost:3001/admin/suppliers \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 4. Testear endpoint de inventario
curl -X GET http://localhost:3001/admin/inventory/items \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Posibles causas

1. **Token no se está enviando**: El accessToken es null o no se carga desde localStorage
2. **CORS bloqueando peticiones**: El backend rechaza peticiones del frontend
3. **Datos no existen en BD**: El seed no se ejecutó correctamente
4. **Endpoints no registrados**: El módulo admin no está registrado en app.module
5. **Guards bloqueando**: JwtAuthGuard o RolesGuard rechazando peticiones
