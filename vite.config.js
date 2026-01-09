import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: This must match your GitHub repo name exactly (case-sensitive)
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages set this to your repo name, e.g. "/my-repo/"
  base: '/AdaptTrack',
})
