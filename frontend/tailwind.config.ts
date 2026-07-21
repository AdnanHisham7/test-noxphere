// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary dark surfaces
        pitch: {
          950: '#050508',
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a24',
          600: '#22222f',
          500: '#2d2d3d',
        },
        // Brand accent - electric green (like eFootball score panels)
        volt: {
          400: '#ccff00',
          500: '#b3e600',
          600: '#99cc00',
        },
        // Secondary accent - cool cyan
        ice: {
          400: '#00d4ff',
          500: '#00b8e0',
          600: '#009cbf',
        },
        // Warning/alert
        ember: {
          400: '#ff6b35',
          500: '#e55a25',
          600: '#cc4a15',
        },
        // Success
        field: {
          400: '#00e676',
          500: '#00c853',
        },
        // Muted text
        slate: {
          350: '#94a3b8',
        },

        // ── Noxphere brand system (orbital) ──
        // Deep space base surfaces — aliased 1:1 to `pitch` so landing and
        // the rest of the app share one dark-surface palette.
        ink: {
          950: '#050508',
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a24',
          600: '#22222f',
          500: '#2d2d3d',
        },
        // Core — the "sun" at the centre of the orbit. Primary accent / CTAs.
        // Aliased to the volt/lime brand color (#ccff00) so the landing
        // page's primary accent matches the rest of the app exactly.
        core: {
          300: '#e0ff66',
          400: '#ccff00',
          500: '#b3e600',
          600: '#99cc00',
        },
        // Ion — orbit paths, links, secondary accent
        ion: {
          300: '#a8b8ff',
          400: '#6e8bff',
          500: '#4d69e0',
        },
        // Plasma — tertiary accent, used sparingly in gradients only
        plasma: {
          400: '#a78bfa',
          500: '#8b6ae0',
        },
        // Noxphere text scale (on ink backgrounds)
        nox: {
          high: '#f4f5fa',
          mid: '#9ca3c2',
          low: '#6b7094',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Impact', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        // Aliases kept for any explicit font-orbital / font-nox usage —
        // same stacks as display/body above, now that the whole app shares
        // one typography system.
        orbital: ['Space Grotesk', 'sans-serif'],
        nox: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      backgroundImage: {
        'pitch-gradient': 'linear-gradient(135deg, #050508 0%, #0a0f1a 50%, #050508 100%)',
        'card-gradient': 'linear-gradient(145deg, #1a1a24 0%, #111118 100%)',
        'volt-glow': 'radial-gradient(circle at center, rgba(204,255,0,0.15) 0%, transparent 70%)',
        'ice-glow': 'radial-gradient(circle at center, rgba(0,212,255,0.1) 0%, transparent 70%)',
        // Noxphere
        'orbit-radial': 'radial-gradient(circle at 50% 40%, rgba(204,255,0,0.14) 0%, rgba(110,139,255,0.08) 38%, transparent 70%)',
        'orbit-core-glow': 'radial-gradient(circle at center, rgba(204,255,0,0.3) 0%, transparent 65%)',
        'orbit-panel': 'linear-gradient(160deg, #1a1a24 0%, #111118 100%)',
        'orbit-cta': 'linear-gradient(135deg, #e0ff66 0%, #ccff00 60%, #b3e600 100%)',
      },
      boxShadow: {
        'volt': '0 0 20px rgba(204,255,0,0.2), 0 0 40px rgba(204,255,0,0.05)',
        'ice': '0 0 20px rgba(0,212,255,0.2), 0 0 40px rgba(0,212,255,0.05)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'panel': '0 8px 32px rgba(0,0,0,0.6)',
        // Noxphere
        'core-glow': '0 0 1px rgba(204,255,0,0.4), 0 0 32px rgba(204,255,0,0.22)',
        'ion-glow': '0 0 24px rgba(110,139,255,0.18)',
        'orbit-card': '0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 40px -20px rgba(0,0,0,0.6)',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
      },
      animation: {
        'pulse-volt': 'pulseVolt 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'score-pop': 'scorePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Noxphere orbital motion
        'orbit-slow': 'orbitSpin 60s linear infinite',
        'orbit-slower': 'orbitSpin 90s linear infinite',
        'orbit-reverse': 'orbitSpinReverse 75s linear infinite',
        'orbit-float': 'orbitFloat 6s ease-in-out infinite',
        'core-pulse': 'corePulse 3.5s ease-in-out infinite',
      },
      keyframes: {
        pulseVolt: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scorePop: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        orbitSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        orbitSpinReverse: {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        orbitFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        corePulse: {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
