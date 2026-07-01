import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { handleAnalyzeGarment } from './api/analyzeGarmentHandler.js'
import { handleRemoveBg } from './api/removeBgHandler.js'

export function cortisApiPlugin(): Plugin {
  return {
    name: 'cortis-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, '')
      const apiKey = env.VITE_PHOTOROOM_API_KEY ?? env.PHOTOROOM_API_KEY
      if (apiKey) {
        process.env.VITE_PHOTOROOM_API_KEY = apiKey
        process.env.PHOTOROOM_API_KEY = apiKey
      }

      const geminiKey =
        env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? env.OPENAI_API_KEY
      if (geminiKey) {
        process.env.GEMINI_API_KEY = geminiKey
      }

      console.log(
        `[cortis-api] Photoroom: ${apiKey ? 'configured' : 'missing'} | Gemini: ${geminiKey ? 'configured' : 'missing'}`,
      )

      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        if (req.url === '/api/remove-bg') {
          void handleRemoveBg(req, res)
          return
        }

        if (req.url === '/api/analyze-garment') {
          void handleAnalyzeGarment(req, res)
          return
        }

        next()
      })
    },
  }
}
