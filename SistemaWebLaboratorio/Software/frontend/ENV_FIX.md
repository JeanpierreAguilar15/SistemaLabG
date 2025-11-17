# Fix para Variables de Entorno del Frontend

## Problema Identificado

El frontend usa **Next.js** (no Vite), por lo tanto las variables de entorno deben usar el prefijo `NEXT_PUBLIC_` en lugar de `VITE_`.

## Solución

Tu archivo `.env.local` debe contener:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Pasos para Corregir

1. Abre el archivo `.env.local` en la carpeta `frontend`
2. Cambia `VITE_API_URL` por `NEXT_PUBLIC_API_URL`
3. Asegúrate de que la URL termine en `/api/v1` (no solo `/api`)
4. Elimina `VITE_WS_URL` (WebSocket no está implementado aún en el frontend)
5. Reinicia el servidor de desarrollo del frontend

## Ejemplo Completo

Tu `.env.local` debería verse así:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Verificación

Después de hacer el cambio y reiniciar el servidor (`npm run dev`), las URLs deberían aparecer correctamente como:
- `http://localhost:3001/api/v1/examenes/catalogo`
- `http://localhost:3001/api/v1/cotizaciones/mis-cotizaciones`

En lugar de:
- `/portal/undefined/examenes/catalogo`
- `/portal/undefined/cotizaciones/mis-cotizaciones`
