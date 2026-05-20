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
        border: 'hsl(var(--border, 240 5.9% 90%))',
        input: 'hsl(var(--input, 240 5.9% 90%))',
        ring: 'hsl(var(--ring, 240 5.9% 10%))',
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 240 10% 3.9%))',
        primary: {
          DEFAULT: 'hsl(var(--primary, 240 5.9% 10%))',
          foreground: 'hsl(var(--primary-foreground, 0 0% 98%))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 240 4.8% 95.9%))',
          foreground: 'hsl(var(--secondary-foreground, 240 5.9% 10%))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive, 0 84.2% 60.2%))',
          foreground: 'hsl(var(--destructive-foreground, 0 0% 98%))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted, 240 4.8% 95.9%))',
          foreground: 'hsl(var(--muted-foreground, 240 3.8% 46.1%))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent, 240 4.8% 95.9%))',
          foreground: 'hsl(var(--accent-foreground, 240 5.9% 10%))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover, 0 0% 100%))',
          foreground: 'hsl(var(--popover-foreground, 240 10% 3.9%))',
        },
        card: {
          DEFAULT: 'hsl(var(--card, 0 0% 100%))',
          foreground: 'hsl(var(--card-foreground, 240 10% 3.9%))',
        },
      },
    },
  },
  plugins: [],
}
