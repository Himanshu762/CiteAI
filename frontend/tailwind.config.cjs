/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ['"Crimson Pro"', '"Playfair Display"', '"Cormorant Garamond"', 'serif'],
        sans: ['"Inter"', '"Lato"', 'sans-serif'],
        script: ['"Allura"', '"Dancing Script"', 'cursive'],
        display: ['"Cinzel"', '"Trajan Pro"', 'serif'],
      },
      colors: {
        // Enhanced Royal Scholar Theme
        'royal': {
          'midnight': '#0f0f23',     // Deep midnight blue
          'navy': '#1a1d3a',        // Rich navy for backgrounds
          'purple': '#2d1b69',      // Royal purple
          'indigo': '#4c1d95',      // Deep indigo
        },
        'parchment': {
          50: '#fffef7',           // Lightest cream
          100: '#fdf6e3',          // Classic parchment
          200: '#f4e4bc',          // Aged parchment
          300: '#e8d5a3',          // Vintage paper
          400: '#d4af37',          // Gold transition
          500: '#b8860b',          // Darker gold
          600: '#996515',          // Antique gold
          700: '#7a4f0a',          // Bronze
          800: '#5c3a08',          // Dark bronze
          900: '#3d2505',          // Deep brown
          950: '#1e1203',          // Darkest brown
        },
        'gold': {
          50: '#fffef0',
          100: '#fefce8',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',          // Primary gold
          600: '#d4af37',          // Classic gold
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        'crimson': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',          // Deep red for accents
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        'emerald': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#059669',          // Rich emerald
          600: '#047857',
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
        },
        // Semantic color mapping
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },
      backgroundImage: {
        'paper-texture': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23f4e4bc\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/svg%3E')",
        'subtle-grid': "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23d4af37\" fill-opacity=\"0.03\" fill-rule=\"evenodd\"%3E%3Cpath d=\"m0 40l40-40h-40v40zm40 0v-40h-40l40 40z\"/%3E%3C/g%3E%3C/svg%3E')",
        'ornate-pattern': "url('data:image/svg+xml,%3Csvg width=\"84\" height=\"84\" viewBox=\"0 0 84 84\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23d4af37\" fill-opacity=\"0.08\"%3E%3Cpath d=\"M84 23c-4.417 0-8-3.584-8-8s3.583-8 8-8V23zm-84 0c4.417 0 8-3.584 8-8s-3.583-8-8-8v16zm0 22c4.417 0 8-3.584 8-8s-3.583-8-8-8v16zm84 0c-4.417 0-8-3.584-8-8s3.583-8 8-8v16z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        'royal-gradient': 'linear-gradient(135deg, #0f0f23 0%, #1a1d3a 25%, #2d1b69 50%, #4c1d95 75%, #6366f1 100%)',
        'gold-gradient': 'linear-gradient(135deg, #fef08a 0%, #eab308 25%, #d4af37 50%, #a16207 75%, #713f12 100%)',
        'parchment-gradient': 'linear-gradient(135deg, #fffef7 0%, #fdf6e3 25%, #f4e4bc 50%, #e8d5a3 75%, #d4af37 100%)',
      },
      boxShadow: {
        'royal': '0 10px 40px -10px rgba(45, 27, 105, 0.3)',
        'gold-glow': '0 0 30px -5px rgba(212, 175, 55, 0.4)',
        'gold-glow-lg': '0 0 60px -10px rgba(212, 175, 55, 0.6)',
        'crimson-glow': '0 0 25px -5px rgba(220, 38, 38, 0.3)',
        'emerald-glow': '0 0 25px -5px rgba(5, 150, 105, 0.3)',
        'inner-glow': 'inset 0 1px 3px 0 rgba(255, 255, 255, 0.1)',
        'deep': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'elegant': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        // Entrance animations
        "royal-entrance": {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(40px) scale(0.95) rotateX(10deg)',
            filter: 'blur(10px)'
          },
          '50%': { 
            opacity: '0.5', 
            transform: 'translateY(20px) scale(0.98) rotateX(5deg)',
            filter: 'blur(5px)'
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0) scale(1) rotateX(0deg)',
            filter: 'blur(0px)'
          },
        },
        "fade-in-up": {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        "slide-in-right": {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        "slide-in-left": {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        
        // Glow and shine effects
        "gold-pulse": {
          '0%, 100%': { 
            'box-shadow': '0 0 20px rgba(212, 175, 55, 0.3)',
            'border-color': 'rgba(212, 175, 55, 0.5)'
          },
          '50%': { 
            'box-shadow': '0 0 40px rgba(212, 175, 55, 0.6)',
            'border-color': 'rgba(212, 175, 55, 0.8)'
          },
        },
        "royal-shimmer": {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        "text-glow": {
          '0%, 100%': { 
            'text-shadow': '0 0 10px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.3), 0 0 30px rgba(212, 175, 55, 0.1)'
          },
          '50%': { 
            'text-shadow': '0 0 20px rgba(212, 175, 55, 0.8), 0 0 30px rgba(212, 175, 55, 0.6), 0 0 40px rgba(212, 175, 55, 0.4)'
          },
        },
        
        // Floating and breathing effects
        "float": {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        "float-slow": {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        "breathe": {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        
        // Typewriter effect
        "typewriter": {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        "blink": {
          '0%, 50%': { 'border-color': 'transparent' },
          '51%, 100%': { 'border-color': '#d4af37' },
        },
        
        // Background effects
        "gradient-shift": {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        "parallax-slow": {
          'from': { transform: 'translateY(0px)' },
          'to': { transform: 'translateY(-50px)' },
        },
        
        // Button and interaction effects
        "press": {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        "wiggle": {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        "bounce-gentle": {
          '0%, 100%': { 
            transform: 'translateY(0)',
            'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '50%': { 
            transform: 'translateY(-5px)',
            'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)'
          },
        },
      },
      animation: {
        // Entrance animations
        "royal-entrance": "royal-entrance 1.2s cubic-bezier(0.23, 1, 0.320, 1) forwards",
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.23, 1, 0.320, 1) forwards",
        "slide-in-right": "slide-in-right 0.8s cubic-bezier(0.23, 1, 0.320, 1) forwards",
        "slide-in-left": "slide-in-left 0.8s cubic-bezier(0.23, 1, 0.320, 1) forwards",
        
        // Glow and shine effects
        "gold-pulse": "gold-pulse 3s ease-in-out infinite",
        "royal-shimmer": "royal-shimmer 2s linear infinite",
        "text-glow": "text-glow 3s ease-in-out infinite",
        
        // Floating and breathing effects
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        
        // Typewriter effect
        "typewriter": "typewriter 2s steps(20) forwards, blink 1s linear infinite",
        
        // Background effects
        "gradient-shift": "gradient-shift 8s ease infinite",
        "parallax-slow": "parallax-slow 20s linear infinite",
        
        // Button and interaction effects
        "press": "press 0.2s ease-in-out",
        "wiggle": "wiggle 0.5s ease-in-out",
        "bounce-gentle": "bounce-gentle 2s infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--foreground)',
            lineHeight: '1.75',
            fontSize: '1.125rem',
            h1: {
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '2.5rem',
              lineHeight: '1.2',
              marginBottom: '1rem',
            },
            h2: {
              fontFamily: 'var(--font-display)', 
              fontWeight: '600',
              fontSize: '2rem',
              lineHeight: '1.3',
              marginBottom: '0.875rem',
            },
            h3: {
              fontFamily: 'var(--font-serif)',
              fontWeight: '600',
              fontSize: '1.5rem',
              lineHeight: '1.4',
              marginBottom: '0.75rem',
            },
            p: {
              marginBottom: '1.25rem',
            },
            blockquote: {
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '1.25rem',
              lineHeight: '1.6',
              borderLeft: '4px solid var(--accent)',
              paddingLeft: '1.5rem',
              marginLeft: '0',
              color: 'var(--muted-foreground)',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}