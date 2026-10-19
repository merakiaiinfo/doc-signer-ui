import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
// This configuration sets up a proxy for API requests to the backend service.
// For example, requests to /api will be proxied to the target 
// specified in the VITE_API_PROXY_TARGET environment variable.
//if backend is deployed on localhost, set VITE_API_PROXY_TARGET
//      to 'http://localhost:3000'.
// If the environment variable is not set, 
//      it defaults to 'https://doc-signer-service.onrender.com'.
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_API_PROXY_TARGET || 'https://doc-signer-service.onrender.com',
                changeOrigin: true,
                secure: true
            }
        }
    }
})
