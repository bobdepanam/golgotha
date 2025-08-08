// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,scss,css}',
  ],
  darkMode: 'class', // Utilise la classe .dark sur <html> pour activer le mode sombre
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'], // Switzer via CSS variable
        serif: ['var(--font-serif)', 'serif'],
      },
      colors: {
        background: 'var(--background-color)',
        text: 'var(--text-color)',
        accent: 'var(--accent-color)',
        border: 'var(--border-color)',
        muted: 'var(--text-muted)',
        link: 'var(--link-color)',
      },
      // Optionnel : typographie responsive plus tard si besoin
      fontSize: {
        'heading-1': '4rem',
        'heading-2': '2.5rem',
        'heading-3': '1.8rem',
        'heading-4': '1.4rem',
        'heading-5': '1.15rem',
        'heading-6': '1rem',
        'body': '1rem',
      },
      lineHeight: {
        'tight': '1.1',
        'snug': '1.2',
        'normal': '1.4',
        'relaxed': '1.7',
      },
      letterSpacing: {
        tightest: '-0.02em',
        tight: '-0.01em',
        wide: '0.05em',
      },
    },
  },
  plugins: [],
};

export default config;
