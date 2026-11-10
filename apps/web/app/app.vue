<!-- The application root: the right-to-left Arabic document, the layer's CSS, the pre-paint appearance bootstrap, and the page outlet. -->
<script setup lang="ts">
import { appearanceBootstrap } from '@wafar/ui/app/composables/useAppearance.ts';

// The render's nonce, so the pre-paint script runs under the page's policy.
const nonce =
  import.meta.server === true
    ? (useRequestEvent()?.context['nonce'] as string | undefined)
    : undefined;

useHead({
  htmlAttrs: { dir: 'rtl', lang: 'ar' },
  script: [
    {
      innerHTML: appearanceBootstrap,
      tagPosition: 'head',
      ...(nonce === undefined ? {} : { nonce }),
    },
  ],
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
