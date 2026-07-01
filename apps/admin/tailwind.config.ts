import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./app/components/**/*.{vue,js,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0e0f12",
        surface: "#171a20",
        "surface-2": "#1f232b",
        text: "#e7e9ee",
        muted: "#9aa0ab",
        accent: "#7c5cff",
        "accent-weak": "#2a2347",
        error: "#ff5c5c",
        ok: "#3fd07a",
      },
    },
  },
  plugins: [],
} satisfies Config;
