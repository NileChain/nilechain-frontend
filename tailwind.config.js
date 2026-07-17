/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        primary:                  '#1B5E20',
        'primary-container':      '#E8F5E9',
        secondary:                '#1b6d24',
        background:               '#fcf9f8',
        surface:                  '#ffffff',
        'surface-container':      '#f0eded',
        'surface-container-low':  '#f6f3f2',
        'on-surface':             '#1b1c1c',
        'on-surface-variant':     '#41493e',
        outline:                  '#717a6d',
        'outline-variant':        '#c1c9bc',
        error:                    '#ba1a1a',
        'error-container':        '#ffdad6',
      },
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
      },
      spacing: {
        'margin-desktop': '32px',
        'margin-mobile':  '16px',
      },
    },
  },
  plugins: [],
};
