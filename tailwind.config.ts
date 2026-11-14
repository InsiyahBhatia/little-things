import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

export default {
  content: ['./src/components/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Colours come from the tokens in globals.css; written this way so
      // opacity modifiers such as bg-night/60 work.
      colors: {
        night: token('night'),
        plum: { DEFAULT: token('plum'), light: token('plum-light') },
        ink: token('ink'),
        paper: { DEFAULT: token('paper'), shade: token('paper-shade'), deep: token('paper-deep') },
        honey: { DEFAULT: token('honey'), deep: token('honey-deep') },
        moss: token('moss'),
        rose: token('rose'),
        mist: token('mist'),
      },
      fontSize: {
        sm: ['var(--text-sm)', '1.4'],
        base: ['var(--text-base)', '1.5'],
        lg: ['var(--text-lg)', '1.3'],
        xl: ['var(--text-xl)', '1.15'],
      },
    },
  },
  plugins: [],
} satisfies Config;
