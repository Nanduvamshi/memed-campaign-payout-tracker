import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f1a32",
        grape: "#6446ef",
        mist: "#f4f2ff",
      },
    },
  },
  plugins: [],
};

export default config;
