import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        // legacy aliases used by dashboard
        headline: ['var(--font-fraunces)', 'Georgia', 'serif'],
        label: ['var(--font-geist)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Editorial palette — landing
        paper: {
          DEFAULT: '#F4EEE3',
          soft: '#FAF6EC',
          sink: '#EBE2D1',
        },
        ink: {
          DEFAULT: '#18120D',
          muted: '#6B5D4F',
          subtle: '#A89B8B',
          rule: '#D9CFBF',
        },
        oxblood: {
          DEFAULT: '#8B2E2A',
          deep: '#5A1A18',
          soft: '#B85A52',
        },
        mustard: {
          DEFAULT: '#C8A74D',
          deep: '#9A7F2E',
          soft: '#E6C977',
        },
        sage: {
          DEFAULT: '#3D5447',
          soft: '#7A8F80',
        },
        saffron: '#D97A2A',
        gold: '#B8914C',

        // Advisor colors (dashboard — preserved)
        legal: '#3b82f6',
        health: '#10b981',
        finance: '#f59e0b',
        psychology: '#8b5cf6',
        home: '#f97316',

        // Dark theme (dashboard — preserved)
        'background': '#0e1320',
        'surface': '#0e1320',
        'surface-dim': '#0e1320',
        'surface-bright': '#343948',
        'surface-container-lowest': '#090e1b',
        'surface-container-low': '#161b29',
        'surface-container': '#1a1f2d',
        'surface-container-high': '#252a38',
        'surface-container-highest': '#303443',
        'surface-variant': '#303443',
        'on-surface': '#dee2f5',
        'on-surface-variant': '#c2c6d6',
        'on-background': '#dee2f5',
        'outline': '#8c909f',
        'outline-variant': '#424754',
        'primary': '#adc6ff',
        'primary-fixed': '#d8e2ff',
        'primary-fixed-dim': '#adc6ff',
        'primary-container': '#4d8eff',
        'on-primary': '#002e6a',
        'on-primary-fixed': '#001a42',
        'on-primary-container': '#00285d',
        'on-primary-fixed-variant': '#004395',
        'inverse-primary': '#005ac2',
        'surface-tint': '#adc6ff',
        'secondary': '#4edea3',
        'secondary-fixed': '#6ffbbe',
        'secondary-fixed-dim': '#4edea3',
        'secondary-container': '#00a572',
        'on-secondary': '#003824',
        'on-secondary-fixed': '#002113',
        'on-secondary-container': '#00311f',
        'on-secondary-fixed-variant': '#005236',
        'tertiary': '#d0bcff',
        'tertiary-fixed': '#e9ddff',
        'tertiary-fixed-dim': '#d0bcff',
        'tertiary-container': '#a078ff',
        'on-tertiary': '#3c0091',
        'on-tertiary-fixed': '#23005c',
        'on-tertiary-container': '#340080',
        'on-tertiary-fixed-variant': '#5516be',
        'error': '#ffb4ab',
        'error-container': '#93000a',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
        'inverse-surface': '#dee2f5',
        'inverse-on-surface': '#2b303e',
      },
      letterSpacing: {
        'editorial': '0.22em',
        'display': '-0.03em',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'edit-rise': 'editRise 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'edit-fade': 'editFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'rule-draw': 'ruleDraw 1.1s cubic-bezier(0.65, 0, 0.35, 1) both',
        'marquee': 'marquee 42s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        editRise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        editFade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        ruleDraw: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
