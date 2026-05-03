/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#07080d',
          secondary: 'rgba(14, 17, 24, 0.88)',
          tertiary: 'rgba(20, 24, 34, 0.96)',
          elevated: 'rgba(12, 14, 22, 0.96)',
        },
        text: {
          primary: '#f5f7ff',
          secondary: '#9aa4c7',
          dim: '#6d7390',
        },
        border: 'rgba(130, 145, 190, 0.16)',
        glass: 'rgba(255, 255, 255, 0.08)',
        accent: {
          purple: '#7c3aed',
          pink: '#ec4899',
          cyan: '#06b6d4',
          green: '#22c55e',
          amber: '#f59e0b',
        },
        ops: '#f59e0b',
        brain: '#06b6d4',
        lab: '#22c55e',
        danger: '#ff5f57',
        warning: '#ffb020',
        success: '#2dd4bf',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(120deg, #7c3aed 0%, #ec4899 100%)',
        'glow-purple': 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)',
        'glow-pink': 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)',
      },
      boxShadow: {
        panel: '0 24px 70px rgba(0, 0, 0, 0.45)',
        'panel-soft': '0 14px 40px rgba(0, 0, 0, 0.28)',
        glow: '0 0 20px rgba(124, 58, 237, 0.28)',
      },
      borderRadius: {
        panel: '18px',
      },
    },
  },
  plugins: [],
}