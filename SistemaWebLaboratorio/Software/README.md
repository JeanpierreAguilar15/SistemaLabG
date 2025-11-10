monolito modular (frontend + backend)

- frontend/: next.js app router con typescript, tailwind-like clases y componentes accesibles.
- backend/: nestjs modular (auth, users/profile, appointments, results, billing, audit).
- database/: migraciones sql. la inicial ya existe (usa tu esquema actual).

notas
- mantener datos clinicos sensibles protegidos y auditar accesos.
- endpoints devuelven json; validacion con dtos.
- frontend usa server components por defecto; subcomponentes interactivos como client.

## Guia de Estilos (Flat Design)

- Paleta base: se respetan los colores principales de marca.
- Sin glassmorphism: no blur, no fondos translucidos ni gradientes llamativos.
- Enfoque plano: contornos claros, rellenos solidos, sombras minimas o nulas.

1. Paleta y tokens de color
- Marca/estructura:
  - `--brand-primary` `#D8232A` (CTAs criticas)
  - `--brand-secondary` `#2A2CCF` (enlaces/enfasis informativo)
  - `--surface-page` `#F8F9FA` (fondo general)
  - `--surface-card` `#FFFFFF` (tarjetas, paneles, tablas)
  - `--border-soft` `#E5E7EB` (borde estandar)
  - `--text-main` `#1F2937`
  - `--text-muted` `#6B7280`
  - `--text-invert` `#FFFFFF`
  - `--focus-ring` `#3B82F6` (halo de foco)
  - `--overlay-scrim` `rgba(0,0,0,.30)` (fondo de overlays)

- Estados (bg/fg):
  - success: bg `#D1FAE5`, fg `#065F46`
  - warning: bg `#FEF3C7`, fg `#92400E`
  - danger: bg `#FFE4E6`, fg `#B91C1C`
  - info: bg `#DBEAFE`, fg `#1E3A8A`

2. Tipografia
- Sans-serif limpia (Inter/Roboto/sistema). Tokens: `heading-lg`, `heading-sm`, `body-main`, `body-muted`.
- Regla: `heading-lg` siempre con linea `body-muted` descriptiva.

3. Espaciado, bordes y radios
- Espacios: `--space-8`, `--space-16`, `--space-24`, `--space-32`.
- Borde estandar: `1px` solido `--border-soft`.
- Radio tarjetas: `--radius-card: 12px`.
- Sombra tarjetas: sin sombra por defecto. Si hace falta, usar `0 1px 0 rgba(0,0,0,0.03)`.

4. Layout base
- Fondo general: `--surface-page` (sin gradientes).
- Contenido dentro de tarjetas/paneles (`--surface-card`, borde suave, radio, padding `--space-16`).
- Navegacion lateral: item activo con relleno solido suave (indigo-50 `#EEF2FF`).

5. Componentes base
- Tarjeta Resumen/KPI: tarjeta blanca, borde suave, radio 12px, padding 16px, acento lateral contextual.
- Lista/Historial: titulo `text-main`, secundaria `text-muted`, badge de estado segun tokens.
- Tabla detallada: dentro de tarjeta; cabeceras claras; celdas con `space-8` vertical.
- Panel lateral: mismo estilo que tarjetas.

6. Accesibilidad
- Foco visible consistente: `outline: 2px solid --focus-ring` con `outline-offset: 2px`.
- Contraste AA; badges con texto explicito.
- Iconos con texto o `aria-label` descriptivo.

Referencias en codigo
- Tokens y globals: `frontend/app/globals.css:1`.
- Tailwind + variables: `frontend/tailwind.config.ts:1`.
- Tarjeta KPI: `frontend/components/ui/kpi-card.tsx:1`.
- Nav lateral: `frontend/components/ui/sidebar-nav.tsx:1`.

