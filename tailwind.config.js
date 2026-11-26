/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0066CC', pressed: '#0369A1', soft: '#E0F2FE' },
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        ink: { DEFAULT: '#0F172A', soft: '#64748B' },
        line: '#CBD5E1',
        success: { DEFAULT: '#10B981', soft: '#ECFDF5', dark: '#047857' },
        warning: { DEFAULT: '#F59E0B', soft: '#FFFBEB', dark: '#B45309' },
        danger: { DEFAULT: '#BA1A1A', soft: '#FFDAD6' },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible Next"', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '16px' },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.08)' },
    },
  },
  plugins: [],
};
