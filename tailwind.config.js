/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Verde-limão da marca Sousa Costa (#9AD52A)
        brand: {
          50: "#f6fce9",
          100: "#eaf8cd",
          200: "#d6f2a0",
          300: "#bde866",
          400: "#a8dd3d",
          500: "#9AD52A",
          600: "#7cb31d",
          700: "#5f8a19",
          800: "#4c6d1a",
          900: "#405c1b",
          950: "#21330a",
        },
        // Índigo/roxo-azulado da marca (#3E4095)
        royal: {
          50: "#eeeef8",
          100: "#dcdcf1",
          200: "#bcbde4",
          300: "#9698d2",
          400: "#7173bf",
          500: "#5254a8",
          600: "#3E4095",
          700: "#34357c",
          800: "#2c2d63",
          900: "#262750",
          950: "#171730",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(154,213,42,0.25), 0 20px 60px -15px rgba(62,64,149,0.35)",
        card: "0 10px 40px -12px rgba(38,39,80,0.18)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -30px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        blob: "blob 14s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};
