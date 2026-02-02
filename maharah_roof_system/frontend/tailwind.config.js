/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8dcc8',
          300: '#d4a574',
          400: '#b8885d',
          500: '#8b6f47',
          600: '#6f4e37',
          700: '#5c4230',
          800: '#4a3728',
          900: '#2d1e14',
        },
        cream: {
          50: '#fffef9',
          100: '#fffcf0',
          200: '#fef6e0',
          300: '#f5deb3',
          400: '#e8c992',
          500: '#d4a574',
        }
      }
    },
  },
  plugins: [],
}
