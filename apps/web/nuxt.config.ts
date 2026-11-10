// The Nuxt application: the layer, the UI module, the API proxy, and the
// right-to-left Arabic document the platform always renders (FR-026).
export default defineNuxtConfig({
  extends: ['@wafar/ui'],
  modules: ['@nuxt/ui'],
  css: ['~/assets/main.css'],
  devtools: { enabled: false },
  typescript: { strict: true },
  app: {
    head: {
      htmlAttrs: { dir: 'rtl', lang: 'ar' },
      titleTemplate: '%s — منصة وفر',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env['API_BASE'] ?? 'http://localhost:3001',
    },
  },
  ui: {
    theme: {
      colors: ['primary', 'gray', 'slate', 'success', 'error'],
    },
  },
});
