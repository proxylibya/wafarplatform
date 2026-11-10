<!-- The bottom bar: five slots on a narrow screen, the raised search action, and the bound scroll rule — 32 px down hides, 16 px up or within 56 px of the top returns, 220 ms, and the drawer keeps it visible (FR-052, AC-042, contracts/ui-contracts.md §8.3). -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { bottomBarSlots, destinationFor } from '@wafar/shared';
import WfIcon from '../WfIcon.vue';
import type { WfIconName } from '../../types/icon.ts';

const props = withDefaults(
  defineProps<{ guest?: boolean; drawerOpen?: boolean }>(),
  { guest: false, drawerOpen: false },
);

const emit = defineEmits<{ openDrawer: [] }>();

const icons: Record<string, WfIconName> = {
  home: 'home',
  upload: 'upload',
  search: 'search',
  'my-files': 'my-files',
  more: 'more',
};

const hidden = ref(false);
let lastY = 0;
let down = 0;
let up = 0;
let framed = false;

function reduceMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function onScroll(): void {
  const y = window.scrollY;
  if (props.drawerOpen || reduceMotion()) {
    hidden.value = false;
    lastY = y;
    return;
  }
  const delta = y - lastY;
  if (delta > 0) {
    down += delta;
    up = 0;
  } else if (delta < 0) {
    up += -delta;
    down = 0;
  }
  if (y <= 56) hidden.value = false;
  else if (down >= 32) hidden.value = true;
  else if (up >= 16) hidden.value = false;
  lastY = y;
  if (!framed && typeof window !== 'undefined') {
    framed = true;
    window.requestAnimationFrame(() => {
      framed = false;
    });
  }
}

onMounted(() => {
  lastY = window.scrollY;
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <nav
    class="wf-shell-bottom-bar"
    :class="{ 'wf-shell-bottom-bar--hidden': hidden }"
    :aria-hidden="hidden ? 'true' : undefined"
    :inert="hidden ? true : undefined"
    aria-label="التنقل السفلي"
  >
    <template v-for="slot in bottomBarSlots" :key="slot.key">
      <button
        v-if="slot.key === 'more'"
        type="button"
        class="wf-shell-bottom-bar__slot"
        data-slot="more"
        :aria-expanded="drawerOpen"
        aria-controls="wf-drawer"
        @click="emit('openDrawer')"
      >
        <WfIcon :name="icons[slot.key] ?? 'more'" />
        <span class="wf-shell-bottom-bar__label">{{ slot.label }}</span>
      </button>
      <NuxtLink
        v-else
        :to="destinationFor(slot.path ?? '/', guest)"
        :class="[
          'wf-shell-bottom-bar__slot',
          { 'wf-shell-bottom-bar__slot--raised': slot.raised },
        ]"
        :data-slot="slot.key"
        :aria-label="slot.raised ? 'البحث في القطع' : undefined"
      >
        <WfIcon :name="icons[slot.key] ?? 'home'" />
        <span class="wf-shell-bottom-bar__label">{{ slot.raised ? 'البحث' : slot.label }}</span>
      </NuxtLink>
    </template>
  </nav>
</template>

<style scoped>
.wf-shell-bottom-bar {
  position: fixed;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: var(--wf-z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-around;
  block-size: calc(var(--wf-bottom-bar-height) + env(safe-area-inset-bottom, 0px));
  padding-block-end: env(safe-area-inset-bottom, 0px);
  border-block-start: var(--wf-border-width) solid var(--wf-border);
  background: var(--wf-surface);
  transition: transform 220ms ease;
}
.wf-shell-bottom-bar--hidden {
  transform: translateY(100%);
}
.wf-shell-bottom-bar__slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--wf-space-1);
  min-inline-size: var(--wf-touch-floor);
  min-block-size: var(--wf-touch-floor);
  max-inline-size: 4.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--wf-ink-muted);
  font: inherit;
  font-size: var(--wf-text-xs);
  text-decoration: none;
}
.wf-shell-bottom-bar__label {
  inline-size: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.wf-shell-bottom-bar__slot--raised {
  transform: translateY(-0.5rem);
  block-size: var(--wf-raised-action);
  inline-size: var(--wf-raised-action);
  min-inline-size: var(--wf-raised-action);
  max-inline-size: var(--wf-raised-action);
  justify-content: center;
  border-radius: 9999px;
  background: var(--wf-primary);
  color: var(--wf-primary-contrast);
}
.wf-shell-bottom-bar__slot--raised .wf-shell-bottom-bar__label {
  display: none;
}
@media (min-width: 1024px) {
  .wf-shell-bottom-bar {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wf-shell-bottom-bar {
    transition: none;
  }
}
</style>
