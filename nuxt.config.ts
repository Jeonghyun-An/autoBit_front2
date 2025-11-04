// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/icon"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "/rag/llama",
    },
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/rag/",
    head: {
      title: "RAG System",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
  nitro: {
    devProxy: {
      "/llama": { target: "http://localhost:8000/llama", changeOrigin: true },
    },
  },
});
