/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        fade: {
          '0%': { opacity: 0.5, transform: 'translateY(-30px)' },
          '100%': { opacity: 1, transform: 'translateY(0px)' }
        }
      },
      animation: {
        fade: 'fade 0.2s ease-out'
      }
    }
  },
  plugins: []
}
