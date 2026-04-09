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
        background: '#0F172A',
        card: '#1E293B',
        border: '#334155',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        sm: '0.5rem',
        lg: '1rem',
        xl: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-accent': '0 0 20px rgba(16, 185, 129, 0.3)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
