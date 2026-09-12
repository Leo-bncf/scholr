/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        landing: ['var(--font-landing-display)'],
        landingBody: ['var(--font-landing-body)'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Scholr Landing (sl) — a self-contained token set for the redesigned
        // marketing homepage only. Namespaced and additive so it can't collide
        // with (or get overridden by) the app-wide indigo/blue/primary tokens
        // below, which every authenticated screen still depends on.
        sl: {
          paper: 'oklch(97% 0.014 70)',
          paper2: 'oklch(93% 0.016 68)',
          rule: 'oklch(84% 0.020 55)',
          neutral: 'oklch(58% 0.030 40)',
          ink: 'oklch(20% 0.025 35)',
          accent: 'oklch(33% 0.140 28)',
          accentSoft: 'oklch(90% 0.030 28)',
          accentInk: 'oklch(97% 0.014 70)',
          accent2: 'oklch(70% 0.100 75)',
          focus: 'oklch(40% 0.150 28)',
        },
        // Global theme pivot: remap indigo + blue palettes to emerald/green
        // so every hardcoded bg-indigo-*, text-blue-*, border-indigo-* across
        // the app renders in the dark green theme without touching each file.
        indigo: {
          50:  '#effaf6',
          100: '#d7f1e6',
          200: '#aee2ce',
          300: '#78ccae',
          400: '#42b089',
          500: '#1f8f6b',
          600: '#147056',
          700: '#0f5a46',
          800: '#0c4638',
          900: '#0a372c',
          950: '#062018',
        },
        blue: {
          50:  '#effaf6',
          100: '#d7f1e6',
          200: '#aee2ce',
          300: '#78ccae',
          400: '#42b089',
          500: '#1f8f6b',
          600: '#147056',
          700: '#0f5a46',
          800: '#0c4638',
          900: '#0a372c',
          950: '#062018',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        moveHorizontal: {
          '0%': {
            transform: 'translateX(-50%) translateY(-10%)',
          },
          '50%': {
            transform: 'translateX(50%) translateY(10%)',
          },
          '100%': {
            transform: 'translateX(-50%) translateY(-10%)',
          },
        },
        moveInCircle: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '50%': {
            transform: 'rotate(180deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        moveVertical: {
          '0%': {
            transform: 'translateY(-50%)',
          },
          '50%': {
            transform: 'translateY(50%)',
          },
          '100%': {
            transform: 'translateY(-50%)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        first: 'moveVertical 30s ease infinite',
        second: 'moveInCircle 20s reverse infinite',
        third: 'moveInCircle 40s linear infinite',
        fourth: 'moveHorizontal 40s ease infinite',
        fifth: 'moveInCircle 20s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
