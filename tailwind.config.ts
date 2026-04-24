import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0d1f1a',
          card: '#1a3028',
        },
        accent: {
          orange: '#F5A623',
          green:  '#2E7D5B',
          red:    '#C0392B',
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#8A9E97',
        },
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
export default config
