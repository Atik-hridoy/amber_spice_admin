import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        brand: {
          terracotta: "#B84A22",
          amber: "#FBA138",
          gold: "#D49B37",
          dark: "#1A130E",
          cardDark: "#241C16",
          grayBg: "#F9F9F9",
          cream: "#FAF9F5",
          border: "#E5E5E5",
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
