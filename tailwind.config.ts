import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14211f",
        paper: "#f7faf9",
        line: "#d7e0dd",
        sea: "#0f766e",
        clay: "#a65f2b",
        berry: "#9f1239"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(20, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
