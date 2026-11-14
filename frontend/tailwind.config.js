/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1320px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'Geist Variable',
          'Geist',
          'Geist Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        zen: {
          primary: '#172554',
          ink: '#17202F',
          secondary: '#697586',
          muted: '#697586',
          subtle: '#8F94A2',
          accent: '#465BE5',
          'accent-hover': '#3549CC',
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          studio: '#F1F3F6',
          border: '#E5E7EB',
          'border-strong': '#D1D5DB',
          success: '#15976B',
          warning: '#D69A29',
        },
        navy: {
          950: '#0E1118',
          900: '#151923',
          800: '#232836',
          700: '#3C4254',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 1px)',
        sm: 'calc(var(--radius) - 2px)',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(21, 25, 35, 0.03)',
        soft: '0 1px 3px rgba(21, 25, 35, 0.04), 0 1px 2px rgba(21, 25, 35, 0.02)',
        elevated: '0 12px 32px -6px rgba(21, 25, 35, 0.08), 0 2px 6px -1px rgba(21, 25, 35, 0.03)',
      },
    },
  },
  plugins: [],
};
