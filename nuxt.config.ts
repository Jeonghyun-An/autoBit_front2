// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      backendHost: process.env.NUXT_BACKEND_HOST || 'http://localhost:8000/'
    }
  },
  app:{
    head:{
      title: 'RAG System',
      meta:[{name:'viewport', content:'width=device-width, initial-scale=1'}]
  }
  },
})