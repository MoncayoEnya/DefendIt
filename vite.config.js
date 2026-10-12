import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Runs api/ai.js inside the local dev/preview server, so the AI works with `npm run dev`
// exactly like it does on Vercel. The AI keys are read from .env (GEMINI_API_KEY, GROQ_API_KEY) and
// stays on the server; it is NOT exposed to the browser (only VITE_* variables are).
function localApi() {
  const file = fileURLToPath(new URL('./api/ai.js', import.meta.url))
  const mount = (load) => (server) => {
    server.middlewares.use('/api/ai', async (req, res) => {
      const { default: handler } = await load(server)
      handler(req, res)
    })
  }
  return {
    name: 'defendit-local-api',
    configureServer: mount((server) => server.ssrLoadModule(file)),
    configurePreviewServer: mount(() => import(pathToFileURL(file).href)),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GROQ_API_KEY', 'GROQ_MODEL', 'AI_LIMIT_PER_HOUR', 'ALLOWED_ORIGINS']) {
    if (env[k] && !process.env[k]) process.env[k] = env[k]
  }
  return { plugins: [react(), tailwindcss(), localApi()] }
})
