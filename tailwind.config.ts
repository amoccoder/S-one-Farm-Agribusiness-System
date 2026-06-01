import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme base
        'bg-primary': '#0c1110',
        'bg-secondary': '#111716',
        'bg-tertiary': '#161d1a',
        
        // Accent colors - Farm/Agritech theme
        'accent-green': '#16a34a',
        'accent-green-dark': '#15803d',
        'accent-green-light': '#22c55e',
        
        // Warning & Danger
        'accent-amber': '#f59e0b',
        'accent-red': '#ef4444',
        
        // Text colors
        'text-primary': '#f5f5f4',
        'text-secondary': '#a8a29e',
        'text-muted': '#78716f',
        
        // Borders & dividers
        'border-light': 'rgba(255, 255, 255, 0.06)',
        'border-medium': 'rgba(255, 255, 255, 0.12)',
      },
      backgroundColor: {
        'glass': 'rgba(17, 23, 22, 0.7)',
      },
      borderColor: {
        'glass': 'rgba(255, 255, 255, 0.08)',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(22, 163, 74, 0.15)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
        'card': '0 4px 6px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        'sans': ['Inter', 'SF Pro Display', 'Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.08em' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['15px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      spacing: {
        'gutter': '24px',
      },
    },
  },
  plugins: [],
}
export default config
