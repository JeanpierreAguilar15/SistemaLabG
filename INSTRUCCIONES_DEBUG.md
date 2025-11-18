# 🔍 Instrucciones para Diagnosticar Páginas Admin Vacías

He añadido herramientas de debugging extensivas para identificar por qué las páginas aparecen vacías. Sigue estos pasos:

## 📋 Paso 1: Hacer git pull

```bash
cd /ruta/a/SistemaLabG
git pull
```

## 🖥️ Paso 2: Verificar archivo .env.local del frontend

El frontend **DEBE** tener un archivo `.env.local` con:

```bash
cd SistemaWebLaboratorio/Software/frontend
cat .env.local
```

Debe contener:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Si el archivo NO existe**, créalo:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > .env.local
```

## 🚀 Paso 3: Reiniciar el frontend

```bash
# Detener el frontend actual (Ctrl+C)
# Luego reiniciar:
npm run dev
```

**IMPORTANTE**: Next.js solo lee variables de entorno al iniciar. Si cambias .env.local, debes reiniciar el servidor.

## 🔎 Paso 4: Usar la página de Debug

1. Abre el navegador y ve a: **http://localhost:3000/admin/debug**

2. Esta página te mostrará:
   - ✅ Si `NEXT_PUBLIC_API_URL` está definida
   - ✅ Tu usuario actual
   - ✅ Tu access token (primeros 50 caracteres)

3. Haz clic en el botón **"Run Tests"**

4. Verás el resultado de llamar a cada endpoint:
   - `/admin/packages`
   - `/admin/suppliers`
   - `/admin/inventory/items`

5. Revisa los resultados:
   - **Status 200** = ✅ Funciona correctamente
   - **Status 401** = ❌ Token inválido o expirado (vuelve a hacer login)
   - **Status 403** = ❌ No tienes permisos de admin
   - **Status 404** = ❌ Endpoint no encontrado (problema con la URL base)
   - **Status 500** = ❌ Error en el backend

## 📊 Paso 5: Revisar Console del Navegador

Abre las herramientas de desarrollador (F12), ve a la pestaña **Console**.

Cuando visites `/admin/paquetes`, verás logs como:

```
=== PAQUETES DEBUG ===
API_URL: http://localhost:3001/api/v1
Full URL: http://localhost:3001/api/v1/admin/packages
Token exists: true
Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWI...
Packages response status: 200
Packages loaded successfully: 3 items
```

### ✅ Si ves esto, el problema está resuelto
### ❌ Si ves algo diferente, copia TODA la salida y envíamela

## 🔧 Paso 6: Revisar pestaña Network

1. En DevTools (F12), ve a la pestaña **Network**
2. Filtra por "packages" o "suppliers"
3. Deberías ver las peticiones HTTP
4. Haz clic en cada petición para ver:
   - **Headers**: ¿Se envía Authorization?
   - **Response**: ¿Qué devuelve el backend?

## ⚠️ Problemas Comunes

### Problema: API_URL es undefined
**Solución**: Crea/verifica .env.local y reinicia el frontend

### Problema: Token es null
**Solución**: Vuelve a hacer login en la aplicación

### Problema: Status 404
**Solución**: Verifica que el backend esté corriendo en puerto 3001

### Problema: CORS error
**Solución**: Verifica que el backend tenga CORS habilitado para http://localhost:3000

## 📸 ¿Qué información necesito?

Si el problema persiste, envíame:

1. **Screenshot de /admin/debug** completo
2. **Console logs** cuando visitas /admin/paquetes
3. **Network tab** mostrando las peticiones
4. **Contenido de .env.local** del frontend
5. **Logs del backend** cuando visitas las páginas

## 🎯 Próximos pasos

Una vez identifiquemos el problema con estas herramientas, implementaré:
- ✅ Modals para crear/editar paquetes
- ✅ Modals para crear/editar proveedores
- ✅ Modals para crear/editar items de inventario
- ✅ Validación de formularios
- ✅ Manejo de errores
