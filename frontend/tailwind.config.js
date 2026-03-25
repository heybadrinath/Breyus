/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Metric card accent colors - borders
    'border-l-blue-500',
    'border-l-green-500',
    'border-l-purple-500',
    'border-l-orange-500',
    'border-l-cyan-500',
    'border-l-emerald-500',
    'border-l-indigo-500',
    'border-l-pink-500',
    // Metric card accent colors - gradients
    'from-blue-500/10',
    'from-green-500/10',
    'from-purple-500/10',
    'from-orange-500/10',
    'from-cyan-500/10',
    'from-emerald-500/10',
    'from-indigo-500/10',
    'from-pink-500/10',
    'via-blue-500/5',
    'via-green-500/5',
    'via-purple-500/5',
    'via-orange-500/5',
    'via-cyan-500/5',
    'via-emerald-500/5',
    'via-indigo-500/5',
    'via-pink-500/5',
  ],
  theme: {
    extend: {
      // Editorial Typography - Poppins
      fontFamily: {
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      screens: {
        '3xl': '1920px'
      },
      colors: {
        // Earth Tone Palette - Editorial Style
        // Cream (Paper backgrounds)
        cream: {
          DEFAULT: '#FFFDF7',
          50: '#FFFDF7',
          100: '#F9F6F3',
        },
        // Brown palette (Headlines, body text)
        brown: {
          50: '#F9F6F3',
          100: '#F3EDE6',
          200: '#E7DED3',
          300: '#C9B8A6',
          400: '#A6917A',
          500: '#96795A',
          600: '#7D6349',
          700: '#5E4A38',
          800: '#443628',
          900: '#2A211A',
          950: '#1A1410',
        },
        // Sage green (Success, eco-friendly accents)
        sage: {
          50: '#F4F7F3',
          100: '#E8EDE5',
          200: '#D1DBCC',
          300: '#B0C4A7',
          400: '#8AAB7D',
          500: '#6B8C5E',
          600: '#56724A',
          700: '#455C3C',
          800: '#394B32',
          900: '#313F2C',
        },
        // Gold accent (Links, CTAs - use sparingly)
        gold: {
          DEFAULT: '#B8860B',
          50: '#FDF8EC',
          100: '#F9EDCF',
          200: '#F0D68F',
          300: '#D4A84A',
          400: '#C49520',
          500: '#B8860B',
          600: '#9A7209',
          700: '#7C5C07',
          800: '#5E4605',
          900: '#403003',
        },
        // Keep brand as alias for backward compatibility (maps to gold)
        brand: {
          50: '#F5F2E8',
          100: '#EBE5D1',
          200: '#D4C89A',
          300: '#BCA86B',
          400: '#A69158',
          500: '#867C5B',
          600: '#6B6248',
          700: '#524B37',
          800: '#3A3527',
          900: '#231F18',
        },
        // Surface colors for backgrounds
        surface: {
          primary: '#FFFFFF',
          secondary: '#FFFDF7',  // Cream paper
          tertiary: '#F9F6F3',   // Warm off-white
        },
        // Blog-specific utility colors (Clean White + Dark Text + Refined Gold)
        'blog-dark': '#1A1A2E',
        'blog-body': '#4B5563',
        'blog-muted': '#6B7280',
        'blog-border': '#E5E7EB',
        'blog-surface': '#F9FAFB',
      },
      // Refined animations - subtle, not bouncy
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
        'card-lift': 'cardLift 0.2s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08) translate(-1%, -0.5%)' },
        },
        cardLift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
          '100%': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
        },
      },
      // Subtle box shadows for editorial cards
      boxShadow: {
        'editorial': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'editorial-hover': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'editorial-lg': '0 12px 40px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
