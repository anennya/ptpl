/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bcfc',
          400: '#819bf9',
          500: '#6377f3',
          600: '#4f56e6',
          700: '#4342c7',
          800: '#3639a2',
          900: '#1E3A8A',
        },
        secondary: {
          50: '#f5f7fa',
          100: '#ebeef5',
          200: '#d2daea',
          300: '#adbcd5',
          400: '#839abe',
          500: '#6580aa',
          600: '#4e648c',
          700: '#3e4f72',
          800: '#354361',
          900: '#2d3a51',
        },
        accent: {
          50: '#fff4ed',
          100: '#ffe8d4',
          200: '#ffd0aa',
          300: '#ffb174',
          400: '#ff8a3d',
          500: '#ff6a15',
          600: '#f14a06',
          700: '#c73608',
          800: '#9e2d0e',
          900: '#7e280f',
        },
        success: {
          500: '#10B981',
        },
        warning: {
          500: '#F59E0B',
        },
        error: {
          500: '#EF4444',
        },
      },
      fontSize: {
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      borderRadius: {
        'xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};