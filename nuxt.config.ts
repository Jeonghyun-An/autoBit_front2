// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "/llama",
    },
  },
  app: {
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
