/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          steel: '#2574A9',
          sky: '#4FB4EC',
          cornflower: '#5B9BD5',
        },
        uts: {
          nav: '#8D8D8D',
          text: '#333333',
          bg: '#F7F8FA',
          muted: '#D1D5DB',
        },
      },
    },
  },
  plugins: [],
};
