/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      colors: {
        // E-Tontine Design System (from Stitch)
        primary: {
          DEFAULT: 'hsl(var(--ds-primary) / <alpha-value>)',
          foreground: 'hsl(var(--ds-on-primary) / <alpha-value>)',
          container: '#00873a',
          fixed: '#7ffc97',
          'fixed-dim': '#62df7d',
        },
        secondary: {
          DEFAULT: 'hsl(var(--ds-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--ds-on-secondary) / <alpha-value>)',
          container: '#8fa7fe',
          fixed: '#dce1ff',
          'fixed-dim': '#b6c4ff',
        },
        tertiary: {
          DEFAULT: '#a72d51',
          foreground: '#ffffff',
          container: '#c74668',
        },
        surface: {
          DEFAULT: 'hsl(var(--ds-surface) / <alpha-value>)',
          bright: 'hsl(var(--ds-surface-bright) / <alpha-value>)',
          dim: 'hsl(var(--ds-surface-dim) / <alpha-value>)',
          light: 'hsl(var(--ds-surface-light) / <alpha-value>)',
          variant: 'hsl(var(--ds-surface-variant) / <alpha-value>)',
          tint: '#006e2d',
          container: {
            DEFAULT: 'hsl(var(--ds-container) / <alpha-value>)',
            low: 'hsl(var(--ds-container-low) / <alpha-value>)',
            high: 'hsl(var(--ds-container-high) / <alpha-value>)',
            highest: 'hsl(var(--ds-container-highest) / <alpha-value>)',
            lowest: 'hsl(var(--ds-container-lowest) / <alpha-value>)',
          },
        },
        background: {
          DEFAULT: 'hsl(var(--background))',
        },
        foreground: 'hsl(var(--foreground))',
        // Semantic aliases
        'on-primary': 'hsl(var(--ds-on-primary) / <alpha-value>)',
        'on-primary-container': '#f7fff2',
        'on-secondary': 'hsl(var(--ds-on-secondary) / <alpha-value>)',
        'on-secondary-container': '#1d3989',
        'on-secondary-fixed': '#00164e',
        'on-secondary-fixed-variant': '#264191',
        'on-tertiary': '#ffffff',
        'on-surface': 'hsl(var(--ds-on-surface) / <alpha-value>)',
        'on-surface-variant': 'hsl(var(--ds-on-surface-variant) / <alpha-value>)',
        'on-background': 'hsl(var(--ds-on-background) / <alpha-value>)',
        outline: 'hsl(var(--ds-outline) / <alpha-value>)',
        'outline-variant': 'hsl(var(--ds-outline-variant) / <alpha-value>)',
        'border-light': 'hsl(var(--ds-border-light) / <alpha-value>)',
        'text-main': 'hsl(var(--ds-text-main) / <alpha-value>)',
        'text-muted': 'hsl(var(--ds-text-muted) / <alpha-value>)',
        'inverse-primary': '#62df7d',
        'inverse-surface': '#2b322b',
        'inverse-on-surface': '#ecf3e7',
        'primary-fixed': '#7ffc97',
        'primary-fixed-dim': '#62df7d',
        'error': {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        warning: '#F97316',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#ffffff',
        },
        // shadcn-compatible tokens (kept for component compatibility)
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      spacing: {
        'container-max': '1280px',
        'margin-desktop': '32px',
        'margin-mobile': '16px',
        gutter: '24px',
        'sidebar-w': '260px',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'auth-card-enter': {
          from: { opacity: '0', transform: 'translateY(18px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'auth-rise': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'auth-card-enter': 'auth-card-enter 620ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'auth-rise': 'auth-rise 760ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
      boxShadow: {
        ambient: '0 10px 40px -10px rgba(30, 58, 138, 0.08)',
        xs: '0 1px 2px 0 rgba(30, 58, 138, 0.05)',
        card: '0 1px 2px 0 rgba(30, 58, 138, 0.05)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
