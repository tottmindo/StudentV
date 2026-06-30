export default {
  darkMode: "media",
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        // Primary typography and page text
        primary: {
          light: '#F5F2EE', // soft off-white for muted elements
          DEFAULT: '#1B1C1C', // almost-black primary body text
          dark: '#0F1010', // deep charcoal for strong contrast
        },

        // Accent red used for buttons and interactive states
        accent: {
          light: '#F8D6D6', // pale red for hover/active backgrounds
          DEFAULT: '#CF2E2E', // main red accent color
          dark: '#9C2525', // darker red for pressed states
        },

        // Page backgrounds
        'background-light': '#F7F7F5', // warm very light page background
        background: '#FFFFFF', // plain white page background
        'background-dark': '#121212', // near-black dark mode background

        // Card surface / content background
        card: '#F0F0F3', // soft neutral surface for cards
        surface: '#F2EEE6', // slightly warm surface tone in light mode
        'surface-dark': '#1F1F1F', // dark surface tone in dark mode

        // Typography
        'text': '#1B1C1C', // default body text in light mode
        'text-headline': '#111111', // headline text in light mode
        'text-dark': '#F5F2EE', // light text used in dark mode

        // Borders
        'border-border': '#D8D8D8', // neutral border and divider color

        // Semantic helpers
        success: '#2E7D32', // success green
        warning: '#F2A63C', // warning orange
        error: '#CF2E2E', // error red
      },
    },
  },
}