/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d8f3ff',
          500: '#2ec4ff',
          600: '#1ca1d8',
          900: '#061b2d',
        },
        danger: '#ff5c7a',
        warn: '#ffb84d',
        ok: '#2ad6a9',
        ink: '#0b1220',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(46,196,255,0.3), 0 20px 50px rgba(14,165,233,0.15)',
      },
    },
  },
  plugins: [],
}
