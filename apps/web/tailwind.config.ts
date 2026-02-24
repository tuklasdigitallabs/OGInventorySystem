import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f7f2",
          100: "#eaeddc",
          500: "#6f7d41",
          700: "#4a5428",
          900: "#2e3318"
        }
      }
    }
  },
  plugins: []
};

export default config;

