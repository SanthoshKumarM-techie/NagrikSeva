/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',
          cardLight: '#FFFFFF',
          cardDark: '#1E293B',
          secondaryLight: '#F1F5F9',
          secondaryDark: '#334155'
        }
      },
      letterSpacing: {
        tightest: '-0.5px',
      }
    },
  },
  plugins: [],
}
