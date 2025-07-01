/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        correct: '#6aaa64',
        'wrong-position': '#c9b458',
        'not-in-puzzle': '#787c7e',
        'cell-empty': '#d3d6da',
        'cell-filled': '#878a8c'
      },
      screens: {
        'xs': '320px',
      }
    },
  },
  plugins: [],
}