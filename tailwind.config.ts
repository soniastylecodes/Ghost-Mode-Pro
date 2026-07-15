import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ghost Mode brand system (PRD Section 2) via CSS variables
        void: "var(--color-void)",
        signal: "var(--color-signal)",       // Signal Green
        "deep-green": "var(--color-deep-green)", // Deep Green
        bone: "var(--color-bone)",
        steel: "var(--color-steel)",
        slate: "var(--color-slate)",
        // Semantic surfaces derived from Void
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        border: "var(--color-border)",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "system-ui", "sans-serif"],
        sora: ["var(--font-sora)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(4, 186, 99, 0.35)",
        "glow-lg": "0 0 48px rgba(4, 186, 99, 0.28)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 16px rgba(4, 186, 99, 0.25)" },
          "50%": { boxShadow: "0 0 32px rgba(4, 186, 99, 0.5)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
