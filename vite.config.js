import path from "path"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig } from "vite"

export default defineConfig({
  // Use root for Vercel, Netlify or local dev, use project name for GitHub Pages
  base: (process.env.VERCEL || process.env.NETLIFY) ? "/" : "/LoyaltyLoop/",
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "not IE 11", "iOS >= 12"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
