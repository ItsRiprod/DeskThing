/** @type {import('tailwindcss').Config} */

export default {
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
        },
        'slide-in': {
          from: {
            transform: 'translateX(100%)'
          },
          to: {
            transform: 'translateX(0)'
          }
        },
        'slide-out': {
          from: {
            transform: 'translateX(0)'
          },
          to: {
            transform: 'translateX(100%)'
          }
        },
        'pop-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.7)'
          },
          '80%': {
            opacity: '1',
            transform: 'scale(1.02)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          }
        }
      },
      animation: {
        'spin-smooth': 'spin 1.3s ease-in-out infinite;',
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'fade-out': 'fade-in-down 0.2s ease-out reverse forwards',
        'slide-in': 'slide-in 0.2s ease-out',
        'slide-out': 'slide-out 0.2s ease-out',
        fade: 'fade 0.2s ease-out forwards',
        'pop-in': 'pop-in 0.2s ease-out forwards'
      }
    }
  }
}
