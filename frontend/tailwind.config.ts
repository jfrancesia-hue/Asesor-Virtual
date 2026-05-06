import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // Sistema "Warm Premium" — display + body de marca
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        // Aliases legacy (no romper componentes que los referencian)
        brand: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        headline: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        label: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
        // Para drop-cap / pull-quote del editorial — único uso serif legítimo
        editorial: ['Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        // ── Brand canónica del usuario (sistema Warm Premium) ──
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          bg: 'var(--primary-bg)',
          dark: 'var(--primary-dark)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          bg: 'var(--accent-bg)',
          dark: 'var(--accent-dark)',
        },
        cta: {
          DEFAULT: 'var(--cta)',
          light: 'var(--cta-light)',
          bg: 'var(--cta-bg)',
          dark: 'var(--cta-dark)',
        },
        'brand-yellow': {
          DEFAULT: 'var(--brand-yellow)',
          bg: 'var(--brand-yellow-bg)',
        },
        'brand-lavender': {
          DEFAULT: 'var(--brand-lavender)',
          bg: 'var(--brand-lavender-bg)',
        },

        // ── Tokens semánticos ──
        ink: {
          strong: 'var(--text-strong)',
          medium: 'var(--text-medium)',
          muted: 'var(--text-muted)',
          // legacy
          DEFAULT: '#18120D',
          rule: '#D9CFBF',
          subtle: '#A89B8B',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          subtle: 'var(--surface-subtle)',
        },

        // ── Editorial palette (legacy — landing) ──
        paper: {
          DEFAULT: '#F4EEE3',
          soft: '#FAF6EC',
          sink: '#EBE2D1',
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

        // ── Brand "ma." legacy ──
        brand: {
          ink: '#0f1011',
          paper: '#f5f2ec',
          mute: '#8a8680',
          dot: 'var(--accent)',
          dotAlt: 'var(--primary)',
          dotAmber: 'var(--cta)',
        },

        // ── Advisor colors — alineados a la paleta de marca ──
        legal: 'var(--primary)',
        health: 'var(--accent)',
        finance: 'var(--cta)',
        psychology: 'var(--brand-lavender)',
        home: 'var(--cta-light)',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tight: '-0.02em',
        editorial: '0.22em',
        eyebrow: '0.07em',
        display: '-0.03em',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        medium: 'var(--shadow-medium)',
        strong: 'var(--shadow-strong)',
      },
      transitionTimingFunction: {
        warm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'warm-fade-in 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'edit-rise': 'editRise 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'edit-fade': 'editFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'rule-draw': 'ruleDraw 1.1s cubic-bezier(0.65, 0, 0.35, 1) both',
        'marquee': 'marquee 42s linear infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
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
