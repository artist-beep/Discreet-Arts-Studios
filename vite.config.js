import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwind()],
  base: "/",
  build: { target: "es2022" },
});
