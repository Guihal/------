import { defineNuxtConfig } from "nuxt/config";

// Plain browser SPA (no Capacitor): ssr:false keeps it a simple client
// bundle, consistent with the mobile app's runtime shape.
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },

  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.scss"],

  // Flat component names (AdminTable, PaginationControls) regardless of subdir.
  components: [{ path: "~/components", pathPrefix: false }],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080",
    },
  },

  app: {
    head: {
      title: "TaskCompanion Admin",
      htmlAttrs: { lang: "ru" },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { name: "theme-color", content: "#0D0F17" },
      ],
    },
  },
});
