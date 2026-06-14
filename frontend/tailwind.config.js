module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        primarySoft: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
        surface: '#f8fafc',
        surfaceSoft: '#f1f5f9',
        textDark: '#0F172A',
      },
      boxShadow: {
        soft: '0 24px 60px -28px rgba(15, 23, 42, 0.18)',
        panel: '0 18px 45px -20px rgba(15, 23, 42, 0.18)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'soft-glow': 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.12), transparent 28%)',
      },
    },
  },
  plugins: [],
};
