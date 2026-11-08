/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cozy: {
          cream: '#FFF9EB',
          sand: '#F5E9CE',
          brown: '#5C4328',
          leaf: '#4E9F6E',
          leafDark: '#367A51',
          coral: '#FF7E67',
          sky: '#68B9E8',
          gold: '#F6B93B',
          berry: '#A569BD',
        }
      },
      fontFamily: {
        rounded: ['"Nunito"', '"Fredoka"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cozy': '0 4px 0 #D8C5A0',
        'cozy-lg': '0 6px 0 #C9B28B',
        'cozy-green': '0 4px 0 #367A51',
        'cozy-coral': '0 4px 0 #D65A45',
        'cozy-gold': '0 4px 0 #C89019',
      }
    },
  },
  plugins: [],
}
