/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Soft Mint & Deep Forest Green Palette (Template Specification)
        forest: {
          900: '#002F18', // Primary ink, selected pills, headings
          800: '#063D21',
          700: '#0B4A2C', // Hover / pressed state
          600: '#1D6440',
          500: '#2E7D55', // Icons, links, accents
        },
        mint: {
          50: '#F0FCEF',  // Raised surfaces, pill inputs, chips
          100: '#E9F4EA', // App page background
          150: '#ECF5EB', // Main card background
          200: '#DFEADD', // Inset panels, table headers, sidebar
          300: '#DDEBDB', // Unselected pills, dividers
          400: '#BED4BC',
        },
        ink: {
          900: '#0F1F17', // Headings, titles
          700: '#2C3E34',
          600: '#4B5F54', // Body text
          400: '#7C8F84', // Captions & subtle text
          300: '#A3B4AA',
        },
        status: {
          safe: '#1F8A5B',
          'safe-bg': '#DDF3E6',
          warning: '#B7791F',
          'warning-bg': '#FBF0D6',
          critical: '#C2413B',
          'critical-bg': '#FBE3E1',
        },
      },
      fontFamily: {
        sans: [
          'Urbanist',
          'Outfit',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'monospace',
        ],
      },
      borderRadius: {
        card: '28px',
        panel: '20px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0, 47, 24, 0.06)',
        card: '0 4px 16px rgba(0, 47, 24, 0.04)',
        elevated: '0 12px 32px rgba(0, 47, 24, 0.08)',
        pill: '0 2px 8px rgba(0, 47, 24, 0.1)',
      },
    },
  },
  plugins: [],
};
