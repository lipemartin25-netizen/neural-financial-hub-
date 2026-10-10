/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neurafin: {
          bg: "#0b0d10",
          surface: "#12151a",
          card: "#161920",
          overlay: "#1c202a",
          gold: "#c9a858",
          goldLight: "#dfc07a",
          goldDark: "#9a7d3a",
          emerald: "#10b981",
          emeraldDark: "#059669",
          text: "#f8fafc",
          muted: "#94a3b8",
          subtle: "#64748b",
          status: {
            received: "#64748b",
            pending: "#f59e0b",
            processing: "#3b82f6",
            ready: "#10b981",
            review: "#f97316",
            unavailable: "#ef4444",
            error: "#dc2626",
            pendingSync: "#eab308",
          },
        },
      },
      boxShadow: {
        goldGlow: "0 0 15px rgba(201, 168, 88, 0.2)",
        emeraldGlow: "0 0 15px rgba(16, 185, 129, 0.2)",
      },
    },
  },
  plugins: [],
};
