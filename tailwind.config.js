const colors = require('tailwindcss/colors')
module.exports = {
   purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: false, // or 'media' or 'class'
    theme: {
      extend: {
        backgroundImage: {
          'chicks-pattern': "url('/src/images/Bg.jpg')",
        },
        fontFamily: {
          lora: "'Shippori Antique B1', sans-serif",
        }
      },
      colors: {
      transparent: 'transparent',
      current: 'currentColor',

      black: colors.black,
      white: colors.white,
      gray: colors.trueGray,
      indigo: colors.indigo,
      red: colors.rose,
      yellow: colors.amber,
      
      mublue: {
        DEFAULT: '#3F51B5',
      },

      muwhite: {
        DEFAULT: '#F8FFF4'
      },
      muyellow: {
        DEFAULT: '#D1AC00'
      },
      mupink: {
        DEFAULT: '#ED33B9'
      },
      
    }
    },
    variants: {
      extend: {},
    },
    plugins: [
   ],
  }
