/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '500px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      // Height-based breakpoints
      hxs: { raw: '(min-height: 500px)' },
      hs: { raw: '(min-height: 600px)' },
      hmd: { raw: '(min-height: 768px)' },
      hlg: { raw: '(min-height: 1024px)' },
      hxl: { raw: '(min-height: 1280px)' }
    },
    extend: {
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        geistMono: ['GeistMono', 'monospace'],
        theBoldFont: ['TheBoldFont', 'sand-serif']
      },

      keyframes: {
        fade: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0px)' }
        },
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        fade: 'fade 0.2s ease-out'
      }
    }
  }
}
