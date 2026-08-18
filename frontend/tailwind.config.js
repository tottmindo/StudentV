export default {
  darkMode: "class",
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        // Primary typography and page text
        primary: {
          light: '#FFF4E8', // warm cream for muted elements
          DEFAULT: '#382E38', // soft aubergine-charcoal body text
          dark: '#302A33', // softened aubergine for strong contrast
        },

        // Accent red used for buttons and interactive states
        accent: {
          light: '#F8D6D6', // pale red for hover/active backgrounds
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)', // theme-aware red accent
          dark: '#9C2525', // darker red for pressed states
        },

        // Page backgrounds
        'background-light': '#D9C7A9', // muted sandy beige page background
        background: '#EEE4D8', // soft cream content background
        'background-dark': '#35313B', // deeper plum-charcoal page background

        // Card surface / content background
        card: '#D6C8B9', // warm clay surface for cards
        surface: '#CFC0AF', // gentle toasted sand surface in light mode
        'surface-dark': '#514A58', // softly colored plum surface in dark mode

        // Typography
        'text': '#382E38', // default body text in light mode
        'text-headline': '#2B232D', // headline text in light mode
        'text-dark': '#FFF4E8', // warm light text used in dark mode

        // Borders
        'border-border': '#B9A796', // warm, distinct border and divider color

        // Semantic helpers
        success: 'rgb(var(--color-success) / <alpha-value>)', // accessible theme-aware green
        warning: 'rgb(var(--color-warning) / <alpha-value>)', // accessible theme-aware amber
        error: 'rgb(var(--color-error) / <alpha-value>)', // accessible theme-aware red
      },
      opacity: {
        40: '0.82',
        45: '0.82',
        50: '0.82',
        55: '0.82',
        60: '0.82',
        65: '0.82',
        70: '0.82',
        75: '0.82',
        80: '0.82',
      },
    },
  },
}
