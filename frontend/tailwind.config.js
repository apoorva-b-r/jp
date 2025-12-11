/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#162266', // Royal Blue
        secondary: '#D0E6FD', // Powder Blue
        highlight: '#F1E4D1', // Bone
        surface: '#0A0F1F', // dark navy card
        'bg-primary': '#000000', // black background
        text: {
          primary: '#FFFFFF',
          secondary: '#D0E6FD',
          muted: '#9AA4C2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'],
      },
      borderRadius: {
        lg: '10px',
      },
      boxShadow: {
        'primary-soft': '0 6px 18px rgba(22,34,102,0.18)'
      }
    },
  },
  plugins: [],
}
