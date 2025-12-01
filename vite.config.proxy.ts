// Proxy configuration for backend API
// This file can be merged into vite.config.ts to enable API proxying
// To use: Copy the server.proxy section into vite.config.ts

export const proxyConfig = {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
};


