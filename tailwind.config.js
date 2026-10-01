/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Luxury black/white/grey
        black: '#000000',
        white: '#FFFFFF',
        charcoal: '#1A1A1A',
        'off-white': '#F5F5F5',
        'soft-grey': '#E8E8E8',
        'medium-grey': '#D0D0D0',
        'light-grey': '#F0F0F0',
        
        // Accents
        'gold': '#C9A961',
        'silver': '#B8B8B8',
        
        // Semantic colors
        success: '#2D5016',
        error: '#8B0000',
        warning: '#B8860B',
      },
      fontFamily: {
        // Display font for headers and titles
        display: ['Georgia', 'serif'],
        // Body font for content
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      fontSize: {
        // Display scale
        'display-lg': ['4rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.005em' }],
        
        // Heading scale
        'h1': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['1.75rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h5': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
        'h6': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        
        // Body scale
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        // Expanded spacing scale
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
        '5xl': '8rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        fade: 'fadeInOut 0.3s ease-in-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      screens: {
        'xs': '360px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}
