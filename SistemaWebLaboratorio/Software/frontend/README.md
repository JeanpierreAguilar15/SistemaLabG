frontend next.js app router

rutas
- /dashboard
- /citas
- /resultados
- /cotizaciones
- /pagos
- /perfil

componentes reutilizables
- components/ui/sidebar-nav.tsx
- components/ui/summary-card.tsx
- components/ui/status-badge.tsx
- components/tables/* (accesibles)
- components/quotation/*

tokens de diseño en app/design/tokens.ts y variables CSS en app/globals.css

ejecución
- opcional: crea `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- `npm run dev` en `software/frontend` (puerto 3000)

estilos
- tailwind mapea colores a variables CSS (ver tailwind.config.ts)
- tarjetas, tablas y paneles: fondo blanco, borde suave, radio ~8px, padding 16px.
