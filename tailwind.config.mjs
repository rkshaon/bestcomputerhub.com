/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          hover: 'hsl(var(--primary-hover) / <alpha-value>)',
          soft: 'hsl(var(--primary-soft) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        header: {
          DEFAULT: 'hsl(var(--header-bg) / <alpha-value>)',
          foreground: 'hsl(var(--header-foreground) / <alpha-value>)',
          card: {
            DEFAULT: 'hsl(var(--header-card) / <alpha-value>)',
            foreground: 'hsl(var(--header-card-foreground) / <alpha-value>)',
          },
          popover: {
            DEFAULT: 'hsl(var(--header-popover) / <alpha-value>)',
            foreground: 'hsl(var(--header-popover-foreground) / <alpha-value>)',
          },
          primary: {
            DEFAULT: 'hsl(var(--header-primary) / <alpha-value>)',
            foreground: 'hsl(var(--header-primary-foreground) / <alpha-value>)',
            hover: 'hsl(var(--header-primary-hover) / <alpha-value>)',
            soft: 'hsl(var(--header-primary-soft) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: 'hsl(var(--header-secondary) / <alpha-value>)',
            foreground: 'hsl(var(--header-secondary-foreground) / <alpha-value>)',
          },
          muted: {
            DEFAULT: 'hsl(var(--header-muted) / <alpha-value>)',
            foreground: 'hsl(var(--header-muted-foreground) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'hsl(var(--header-accent) / <alpha-value>)',
            foreground: 'hsl(var(--header-accent-foreground) / <alpha-value>)',
          },
          border: 'hsl(var(--header-border) / <alpha-value>)',
          input: 'hsl(var(--header-input) / <alpha-value>)',
          ring: 'hsl(var(--header-ring) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
