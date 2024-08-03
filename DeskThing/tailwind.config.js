/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        Wingding: ['Wingding', 'monospace'],
        geistMono: ['GeistMono', 'monospace'],
        THEBOLDFONT: ['THEBOLDFONT', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

