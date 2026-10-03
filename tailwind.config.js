/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        sand: 'rgb(var(--sand) / <alpha-value>)',
        peach: 'rgb(var(--peach) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        honey: 'rgb(var(--honey) / <alpha-value>)',
        heart: 'rgb(var(--heart) / <alpha-value>)',
        string: 'rgb(var(--string) / <alpha-value>)',
        indigo: 'rgb(var(--indigo) / <alpha-value>)',
        leaf: 'rgb(var(--leaf) / <alpha-value>)',
        lilac: 'rgb(var(--lilac) / <alpha-value>)',
        sky: 'rgb(var(--sky) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Cormorant"', 'Georgia', 'serif'],
        sans: ['"Zen Kaku Gothic New"', 'system-ui', 'sans-serif'],
        hand: ['"Gochi Hand"', '"Comic Sans MS"', 'cursive'],
      },
      boxShadow: {
        print: '0 1px 2px rgb(var(--shadow) / .05), 0 10px 24px -14px rgb(var(--shadow) / .22)',
        lift: '0 2px 4px rgb(var(--shadow) / .08), 0 18px 40px -12px rgb(var(--shadow) / .28)',
      },
    },
  },
  plugins: [],
};
