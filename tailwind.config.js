/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          850: '#1a1a1a',
        },
        phoenix: {
          black: '#050505',
          graphite: '#252525',
          surface: '#0d0d0d',
          border: '#1f1f1f',
          gold: '#FFD700',
          'gold-dim': '#B8860B',
          'gold-glow': '#ffcc00',
          muted: '#888888',
        }
      },
      fontFamily: {
        head: ['Oswald', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
