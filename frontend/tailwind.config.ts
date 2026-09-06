import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        "bg-elevated": "#131314",
        "grey-100": "#E4E4E4",
        "grey-400": "#8A8D91",
        "grey-600": "#55585C",
        "grey-800": "#2A2C2E",
        "t-green": "#C8D6B9",
        "t-amber": "#D9C089",
        "t-red": "#C97B72",
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: [
          "var(--font-jetbrains)",
          "'JetBrains Mono'",
          "'IBM Plex Mono'",
          "monospace",
        ],
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
