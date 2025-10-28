import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0c0f1d',
        champagne: '#f7ede2',
        blush: '#e8c7c8',
        jade: '#0f7b6c'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Source Sans Pro"', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
