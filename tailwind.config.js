/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        display: ["Outfit", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 4px rgba(5, 150, 105, 0.12)",
      },
      keyframes: {
        "pin-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "pin-ring": "pin-ring 2.4s cubic-bezier(0.24, 0.6, 0.36, 1) infinite",
      },
    },
  },
  plugins: [],
};
