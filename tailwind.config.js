/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: {
          50: '#F2F7F2', 100: '#DCE9DD', 200: '#B7D2BA', 300: '#8FB994',
          400: '#5E9866', 500: '#3A7A43', 600: '#2C5F2D', 700: '#234B25',
          800: '#1A371C', 900: '#112414',
        },
        moss: {
          50: '#F6FAEE', 100: '#E9F2D3', 200: '#D2E5A8', 300: '#B7D079',
          400: '#97BC62', 500: '#7DA34A', 600: '#628238', 700: '#4B642C',
          800: '#374923', 900: '#212C16',
        },
        gold: {
          50: '#FEF8EB', 100: '#FCEBC4', 200: '#F9D88B', 300: '#F4B860',
          400: '#EF9F35', 500: '#D8821A', 600: '#A86214', 700: '#7C480E',
          800: '#523008', 900: '#2A1903',
        },
        cream: '#FAFAF7',
        ink: '#1A2B1A',
        inkSoft: '#4D5C4F',
        mute: '#8A968B',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,40,22,.04), 0 4px 14px rgba(20,40,22,.06)',
        cardHover: '0 4px 14px rgba(20,40,22,.06), 0 16px 32px rgba(20,40,22,.08)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      keyframes: {
        fadeIn: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'none' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(244,184,96,.55)' }, '50%': { boxShadow: '0 0 0 10px rgba(244,184,96,0)' } },
        pop: { '0%': { opacity: 0, transform: 'scale(.96) translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: {
        'fade-in': 'fadeIn .35s ease-out',
        'pulse-gold': 'pulseGold 2.4s ease-in-out infinite',
        pop: 'pop .25s cubic-bezier(.2,.8,.2,1.1)',
      },
    },
  },
  plugins: [],
}
