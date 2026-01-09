import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Don't proxy requests for JavaScript/TypeScript files (module imports)
        bypass: function(req) {
          // If the request is for a file with extension, don't proxy it
          // These are module imports that Vite should handle
          if (req.url && /\.(js|jsx|ts|tsx|json|css|html|svg|png|jpg|jpeg|gif|ico)$/i.test(req.url)) {
            return req.url;
          }
        },
      },
    },
  },
})

