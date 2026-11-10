// The TanStack Query provider: one client installed once for every app that
// extends this layer, so the session resource's composable reads the same cache
// wherever it is called and no surface creates a second one (FR-032, AC-015;
// the layer owns the provider because both frontends need it).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQueryPlugin, {
    queryClient: new QueryClient(),
  });
});
