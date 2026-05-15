/** @type {import('tailwindcss').Config} */
// Tokens map 1:1 to .skills/DESIGN.md — the single source of truth.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Custom screens — keep DESIGN.md breakpoints
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        // Brand & accent
        primary: '#000000',
        'primary-active': '#1a1a1a',
        'text-link': '#0d74ce',
        'text-link-secondary': '#476cff',

        // Text
        ink: '#171717',
        body: '#60646c',
        'body-strong': '#171717',
        muted: '#999999',
        'muted-soft': '#cccccc',

        // Hairlines
        hairline: '#f0f0f3',
        'hairline-soft': '#f5f5f7',
        'hairline-strong': '#dcdee0',

        // Surfaces
        canvas: '#ffffff',
        'canvas-soft': '#fafafa',
        'surface-card': '#ffffff',
        'surface-strong': '#f0f0f3',
        'surface-dark': '#171717',
        'surface-dark-elevated': '#1a1a1a',

        // On colors
        'on-primary': '#ffffff',
        'on-dark': '#ffffff',
        'on-dark-soft': '#b0b4ba',

        // Atmospheric gradient
        'sky-light': '#cfe7ff',
        'sky-mid': '#a8c8e8',

        // Semantic / accent
        'accent-warning': '#ab6400',
        'accent-preview': '#8145b5',
        'accent-link-bright': '#47c2ff',
        error: '#eb8e90',
        success: '#16a34a',
      },

      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'system-ui',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // Spacing scale from DESIGN.md (extends default scale)
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        base: '16px',
        md: '20px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px',
      },

      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
        pill: '9999px',
        full: '9999px',
      },

      // Direct font-size tokens; lineHeight + tracking baked in.
      fontSize: {
        'display-mega': ['64px', { lineHeight: '1.05', letterSpacing: '-1.92px', fontWeight: '600' }],
        'display-xl': ['48px', { lineHeight: '1.1', letterSpacing: '-1.44px', fontWeight: '600' }],
        'display-lg': ['36px', { lineHeight: '1.15', letterSpacing: '-1.08px', fontWeight: '600' }],
        'display-md': ['28px', { lineHeight: '1.2', letterSpacing: '-0.84px', fontWeight: '600' }],
        'display-sm': ['22px', { lineHeight: '1.25', letterSpacing: '-0.5px', fontWeight: '600' }],
        'title-md': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'title-sm': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption-uppercase': ['11px', { lineHeight: '1.4', letterSpacing: '0.88px', fontWeight: '600' }],
        code: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        button: ['14px', { lineHeight: '1', fontWeight: '500' }],
        'nav-link': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
      },

      boxShadow: {
        // single shadow tier per DESIGN.md
        soft: '0 4px 12px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 6px 18px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 12px 32px rgba(0, 0, 0, 0.08)',
        focus: '0 0 0 3px rgba(0, 0, 0, 0.08)',
      },

      backgroundImage: {
        // Hero sky-blue gradient atmospheric wash (hero-only per DESIGN.md)
        'hero-sky':
          'radial-gradient(60% 80% at 50% 0%, #cfe7ff 0%, rgba(207, 231, 255, 0.55) 35%, rgba(255,255,255,0) 75%)',
      },

      maxWidth: {
        content: '1200px',
      },

      // Premium skeleton shimmer (Boneyard-adjacent: slow, smooth diagonal sheen)
      keyframes: {
        'skeleton-shimmer': {
          '0%': { transform: 'translate3d(-120%, 0, 0) skewX(-14deg)', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { transform: 'translate3d(280%, 0, 0) skewX(-14deg)', opacity: '0' },
        },
      },
      animation: {
        'skeleton-shimmer': 'skeleton-shimmer 1.85s cubic-bezier(0.45, 0, 0.25, 1) infinite',
      },
    },
  },
  plugins: [],
};
