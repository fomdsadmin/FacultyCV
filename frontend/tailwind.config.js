/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            fontFamily: theme('fontFamily.sans').join(','),
            color: theme('colors.gray.700'),
            a: {
              color: theme('colors.blue.500'),
              '&:hover': {
                color: theme('colors.blue.700'),
              },
            },
            h1: {
              fontFamily: theme('fontFamily.sans').join(','),
            },
            h2: {
              fontFamily: theme('fontFamily.sans').join(','),
            },
            h3: {
              fontFamily: theme('fontFamily.sans').join(','),
            },
            // Add other elements as needed
          },
        },
      }),
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#FACE5B",
          "secondary": "#EF8253",
          "accent": "#74C2E4",
          "neutral": "#D9D9D9",
          "base-100": "#ffffff",
          "info": "#545F71",
          "success": "#72CB76",
          "warning": "#F06060",
          "error": "#F80000",
        },
      },
    ],
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
}
