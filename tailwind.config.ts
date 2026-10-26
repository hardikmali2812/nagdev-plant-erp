import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        industrial: {
          dark: "#0F172A",
          sidebar: "#0B132B",
          slate: "#1E293B",
          border: "#E2E8F0",
          card: "#FFFFFF",
          amber: "#D97706",
          amberLight: "#FEF3C7",
          amberHover: "#B45309",
          gold: "#F59E0B",
          goldMuted: "#FFFBEB",
          emerald: "#059669",
          emeraldLight: "#D1FAE5",
          danger: "#DC2626",
          dangerLight: "#FEE2E2",
          cyan: "#0284C7",
          cyanLight: "#E0F2FE",
        },
      },
      fontFamily: {
        mono: ["Consolas", "Monaco", "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
