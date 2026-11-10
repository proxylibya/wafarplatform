<!-- Semantic icon keys over the vendored IconPark outline cut. A component names a key, never a raw `i-*` class and never an emoji (ADR-098, ADR-137). -->
<script setup lang="ts">
import { computed } from 'vue';
import type { WfIconName } from '../types/icon.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- `import.meta.glob` is Vite's
const sources = import.meta.glob('../../../vendor/icon-park-outline/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const files: Record<WfIconName, string> = {
  home: 'home',
  parts: 'search',
  catalogs: 'book-one',
  upload: 'upload-one',
  'my-files': 'folder-open',
  cart: 'shopping-cart',
  notifications: 'bell-ring',
  messages: 'message-one',
  profile: 'user',
  settings: 'setting-two',
  'sign-out': 'logout',
  menu: 'application-menu',
  close: 'close',
  collapse: 'click-to-fold',
  'chevron-down': 'arrow-down',
  sun: 'sun',
  moon: 'moon',
  search: 'search',
  plus: 'plus',
  more: 'more',
  bell: 'bell-ring',
};

const props = withDefaults(
  defineProps<{ name: WfIconName; size?: number; label?: string }>(),
  { size: 20 },
);

const source = computed(() => {
  const file = files[props.name];
  return sources[`../../../vendor/icon-park-outline/${file}.svg`] ?? '';
});
</script>

<template>
  <span
    class="wf-icon"
    role="img"
    :aria-hidden="label === undefined ? 'true' : undefined"
    :aria-label="label"
    :style="{
      '--wf-icon-mask': `url(${source})`,
      width: `${size}px`,
      height: `${size}px`,
    }"
  />
</template>

<style scoped>
.wf-icon {
  display: inline-block;
  flex: none;
  background-color: currentColor;
  mask-image: var(--wf-icon-mask);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
</style>
