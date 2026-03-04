import { type Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f6f3',
          100: '#cfeef0',
          200: '#9fe0d9',
          300: '#6fd1c2',
          400: '#3fb3a4',
          500: '#178f88',
          600: '#117564',
          700: '#0b583f',
          800: '#063a29',
          900: '#012217',
        },
        accent: {
          50: '#fff6e6',
          100: '#ffedd1',
          200: '#ffd7a8',
          300: '#ffc17f',
          400: '#ffac56',
          500: '#ff981c',
          600: '#cc7a16',
          700: '#995b10',
          800: '#663d09',
          900: '#331f04',
        },
        stone: {
          50: '#faf8f6',
          100: '#f3f1ef',
          200: '#e6e2df',
          300: '#d9d3c9',
          400: '#bfb6aa',
          500: '#a79d93',
          600: '#8a806f',
          700: '#6f6555',
          800: '#53493f',
          900: '#3a322b',
        },
        spa: {
          'cream': '#fbf7ef',
          'mist': '#f2f6f5',
          'charcoal': '#2b2f33',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        72: '18rem',
        96: '24rem',
      },
      borderRadius: {
        xl2: '1.25rem',
        '4xl': '2rem',
      },
      boxShadow: {
        luxury: '0 10px 30px rgba(20,16,13,0.08), 0 4px 12px rgba(20,16,13,0.04)',
        card: '0 6px 18px rgba(15,23,42,0.06)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-out both',
        slideUp: 'slideUp 300ms ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
