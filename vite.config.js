import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  // Use root for Vercel or local dev, use project name for GitHub Pages
  base: process.env.VERCEL ? "/" : "/LoyaltyLoop/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
