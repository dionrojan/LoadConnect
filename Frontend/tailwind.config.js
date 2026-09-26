/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF8F4',
          200: '#F5F2EC',
          300: '#EBE6DC',
          400: '#DDD6C8',
        },
        forest: {
          50: '#E8F3EE',
          100: '#D1E7DC',
          500: '#2D6A4F',
          600: '#23533E',
          700: '#1B4332',
          800: '#143326',
          900: '#0D2118',
        },
        charcoal: {
          800: '#232529',
          900: '#17181A',
          950: '#101113',
        },
        brandYellow: '#FBBF24',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 10px 30px -5px rgba(27, 67, 50, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'floating': '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
