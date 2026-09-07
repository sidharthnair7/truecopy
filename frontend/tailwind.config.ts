import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF9",
        "bg-elevated": "#FFFFFF",
        "grey-100": "#18181B",
        "grey-400": "#52525B",
        "grey-600": "#5F6570",
        "grey-800": "#E4E4E7",
        "t-green": "#3F6B45",
        "t-amber": "#7A5B12",
        "t-red": "#A63A2E",
      },
      fontFamily: {
        display: ["Newsreader", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Mono'", "Consolas", "monospace"],
      },
      fontSize: {
        hero: "var(--type-hero)",
        h2: "var(--type-h2)",
        h3: "var(--type-h3)",
        body: "var(--type-body)",
        "mono-sm": "var(--type-mono)",
      },
    },
  },
  plugins: [],
};

export default config;
