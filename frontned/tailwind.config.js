/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#FFFFFF',
        surface: '#FFFFFF',
        'surface-2': '#F8FAFC',
        accent: '#E94560',
        'accent-gold': '#D4890A',
        success: '#00B894',
        danger: '#FF3B3B',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        border: '#E2E2E8',
      },
      fontFamily: {
        heading: ['Cairo', 'sans-serif'],
        body: ['Tajawal', 'sans-serif'],
      },
      fontSize: {
        'base': ['18px', '28px'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(233, 69, 96, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
