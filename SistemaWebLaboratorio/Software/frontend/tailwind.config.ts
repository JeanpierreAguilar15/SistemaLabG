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
        // brand / structure
        'brand-primary': 'var(--brand-primary)', // #D8232A
        'brand-secondary': 'var(--brand-secondary)', // #2A2CCF

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
        card: '0.5rem', // ~8px
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
      },
      spacing: {
        2: '8px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
    },
  },
  plugins: [],
}

export default config
