/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'opacity-70',
    'opacity-50'
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '2rem',
  			lg: '4rem',
  			xl: '5rem',
  			'2xl': '6rem',
  		},
  		screens: {
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1536px',
  		},
  	},
  	extend: {
  		colors: {
  			// Academic Futurist Theme Colors
  			academic: {
  				primary: '#2B3A4E',    // Deep navy (trust)
  				secondary: '#5F7A8A',  // Steel blue (balance)
  				accent: '#4ECDC4',     // Teal (innovation)
  				neutral: '#F5F7FA',    // Light gray (clarity)
  				alert: '#FF6B6B'       // Coral (calls to action)
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: '#2B3A4E',  // Deep navy
  				50: '#F5F7FA',
  				100: '#E5E9EF',
  				200: '#CBD3DF',
  				300: '#AEBDCF',
  				400: '#8FA3BA',
  				500: '#6E89A5',
  				600: '#546C86',
  				700: '#415367',
  				800: '#2B3A4E',
  				900: '#1C2736',
  				950: '#0D141A',
  			},
  			secondary: {
  				DEFAULT: '#5F7A8A',  // Steel blue
  				50: '#F5F7F9',
  				100: '#EBF0F3',
  				200: '#D7E0E5',
  				300: '#BDCCD5',
  				400: '#9CB3C0',
  				500: '#7D99AA',
  				600: '#5F7A8A',
  				700: '#4D6271',
  				800: '#3C4C59',
  				900: '#2B3741',
  				950: '#1A2129',
  			},
  			accent: {
  				DEFAULT: '#4ECDC4',  // Teal
  				50: '#EDFAF9',
  				100: '#DBF5F3',
  				200: '#B7EAE7',
  				300: '#93E0DC',
  				400: '#6FD6D0',
  				500: '#4ECDC4',
  				600: '#31ADA5',
  				700: '#268B84',
  				800: '#1C6963',
  				900: '#134741',
  				950: '#092421',
  			},
  			success: {
  				DEFAULT: '#4ECDC4',  // Using accent teal for success
  				50: '#EDFAF9',
  				100: '#DBF5F3',
  				200: '#B7EAE7',
  				300: '#93E0DC',
  				400: '#6FD6D0',
  				500: '#4ECDC4',
  				600: '#31ADA5',
  				700: '#268B84',
  				800: '#1C6963',
  				900: '#134741',
  				950: '#092421',
  			},
  			warning: {
  				DEFAULT: '#FFB347',  // Amber
  				50: '#FFF8EB',
  				100: '#FFF1D6',
  				200: '#FFE3AE',
  				300: '#FFD685',
  				400: '#FFC85C',
  				500: '#FFB347',
  				600: '#FF9B14',
  				700: '#E08200',
  				800: '#AD6500',
  				900: '#7A4700',
  				950: '#472900',
  			},
  			danger: {
  				DEFAULT: '#FF6B6B',  // Coral
  				50: '#FFF0F0',
  				100: '#FFE1E1',
  				200: '#FFC3C3',
  				300: '#FFA5A5',
  				400: '#FF8888',
  				500: '#FF6B6B',
  				600: '#FF3D3D',
  				700: '#FF0F0F',
  				800: '#DB0000',
  				900: '#AD0000',
  				950: '#5C0000',
  			},
  			neutral: {
  				DEFAULT: '#F5F7FA',  // Light gray
  				50: '#FFFFFF',
  				100: '#F5F7FA',
  				200: '#E5E9EF',
  				300: '#CBD3DF',
  				400: '#AEBDCF',
  				500: '#8FA3BA',
  				600: '#6E89A5',
  				700: '#546C86',
  				800: '#415367',
  				900: '#2B3A4E',
  				950: '#1C2736',
  			},
  			gray: {
  				50: '#f9fafb',
  				100: '#f3f4f6',
  				200: '#e5e7eb',
  				300: '#d1d5db',
  				400: '#9ca3af',
  				500: '#6b7280',
  				600: '#4b5563',
  				700: '#374151',
  				800: '#1f2937',
  				900: '#111827',
  				950: '#030712',
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			chart: {
  				'1': '#4ECDC4',  // Teal
  				'2': '#5F7A8A',  // Steel blue
  				'3': '#2B3A4E',  // Deep navy
  				'4': '#FF6B6B',  // Coral
  				'5': '#FFB347',  // Amber
  			},
  		},
  		fontFamily: {
  			serif: [
  				'Crimson Pro',
  				'Georgia',
  				'serif'
  			],
  			sans: [
  				'Space Grotesk',
  				'IBM Plex Sans',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		animation: {
  			fadeIn: 'fadeIn 300ms ease-in',
  			progress: 'progress 1s linear infinite',
  			'nav-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: 0,
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translateY(0)'
  				}
  			},
  			progress: {
  				'0%': {
  					width: '0%'
  				},
  				'100%': {
  					width: '100%'
  				}
  			}
  		},
  		boxShadow: {
  			academic: '0 4px 14px -2px rgba(79,70,229,0.2)',
  			'academic-lg': '0 10px 25px -3px rgba(79,70,229,0.2)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography')
  ],
};