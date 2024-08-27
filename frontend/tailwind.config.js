/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      boxShadow: {
        'glow': '0px 0px 16px rgba(17, 17, 26, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      height: {
        '90vh': '90vh',
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
