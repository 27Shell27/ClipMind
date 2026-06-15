import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./entrypoints/**/*.{ts,tsx,html}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — consistent across themes
        brand: {
          DEFAULT: '#FF0033',
          hover: '#E60030',
          soft: 'rgba(255, 0, 51, 0.12)',
        },
        // Semantic surface tokens driven by CSS variables (see style.css)
        surface: {
          bg: 'var(--surface-bg)',
          card: 'var(--surface-card)',
          border: 'var(--surface-border)',
          hover: 'var(--surface-hover)',
        },
        content: {
          primary: 'var(--content-primary)',
          muted: 'var(--content-muted)',
          faint: 'var(--content-faint)',
        },
      },
      fontFamily: {
        sans: ['"Roboto"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'progress': 'progress 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-brand': 'pulseBrand 1.5s ease-in-out infinite',
      },
      keyframes: {
        progress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '60%', marginLeft: '20%' },
          '100%': { width: '0%', marginLeft: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 0, 51, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(255, 0, 51, 0.18)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
