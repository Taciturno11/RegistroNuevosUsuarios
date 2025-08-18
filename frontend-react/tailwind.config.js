/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#60a5fa',
          500: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
