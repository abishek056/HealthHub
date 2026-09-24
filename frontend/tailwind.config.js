/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#effcf6',
          100: '#d7f7e9',
          200: '#b1eed4',
          300: '#7be0b7',
          400: '#42cb95',
          500: '#1b8a5a',
          600: '#157348',
          700: '#115c3a',
          800: '#0f4b30',
          900: '#0d3e29',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        brand: {
          teal: '#0c5b52',
          emerald: '#167a68',
          green: '#2e9e66',
          mint: '#e8f7f0',
          mintLight: '#f4fbf8',
          mintCard: '#e2f6ec',
          mintBorder: '#c8eedc',
          darkTeal: '#083329',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
