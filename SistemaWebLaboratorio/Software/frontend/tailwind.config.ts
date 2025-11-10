import type { Config } from 'tailwindcss'

// Colors are mapped to CSS variables so we can keep a single source
// of truth (app/globals.css) while still using Tailwind utility classes.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // brand / structure (tema azul)
        'brand-primary': 'var(--brand-primary)', // #2563EB
        'brand-secondary': 'var(--brand-secondary)', // #1D4ED8

        // surfaces
        'surface-page': 'var(--surface-page)', // #F8F9FA
        'surface-card': 'var(--surface-card)', // #FFFFFF
        'border-soft': 'var(--border-soft)', // #E5E7EB

        // text
        'text-main': 'var(--text-main)', // #1F2937
        'text-muted': 'var(--text-muted)', // #6B7280
        'text-invert': 'var(--text-invert)', // #FFFFFF

        // states (bg/fg pairs)
        'state-success-bg': 'var(--success-bg)',
        'state-success-fg': 'var(--success-fg)',
        'state-warning-bg': 'var(--warning-bg)',
        'state-warning-fg': 'var(--warning-fg)',
        'state-danger-bg': 'var(--danger-bg)',
        'state-danger-fg': 'var(--danger-fg)',
        'state-info-bg': 'var(--info-bg)',
        'state-info-fg': 'var(--info-fg)',
      },
      borderRadius: {
        card: '12px', // radius-card
      },
      spacing: {
        2: '8px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
    },
    boxShadow: {
      sm: '0 1px 0 rgba(0,0,0,0.03)',
      DEFAULT: '0 1px 0 rgba(0,0,0,0.03)',
      md: '0 1px 0 rgba(0,0,0,0.04)',
      lg: '0 1px 0 rgba(0,0,0,0.05)',
      xl: '0 1px 0 rgba(0,0,0,0.06)',
      '2xl': '0 1px 0 rgba(0,0,0,0.06)',
      inner: 'inset 0 1px 0 rgba(255,255,255,0.2)',
      none: 'none',
      // custom flat card if needed
      card: '0 1px 0 rgba(0,0,0,0.04)'
    },
  },
  plugins: [],
}

export default config
