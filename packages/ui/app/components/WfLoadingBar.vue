<!-- The in-place loading bar: it appears after 120 ms and stays for at least 300 ms, so a fast answer never flashes and a slow one is visible (ADR-128 §9). -->
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{ loading: boolean; label?: string }>();

const visible = ref(false);
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let shownAt = 0;

function clearTimers(): void {
  if (showTimer !== undefined) clearTimeout(showTimer);
  if (hideTimer !== undefined) clearTimeout(hideTimer);
  showTimer = undefined;
  hideTimer = undefined;
}

watch(
  () => props.loading,
  (loading) => {
    clearTimers();
    if (loading) {
      showTimer = setTimeout(() => {
        visible.value = true;
        shownAt = Date.now();
      }, 120);
      return;
    }
    if (!visible.value) return;
    const elapsed = Date.now() - shownAt;
    const remaining = Math.max(0, 300 - elapsed);
    hideTimer = setTimeout(() => {
      visible.value = false;
    }, remaining);
  },
  { immediate: true },
);

onBeforeUnmount(clearTimers);
</script>

<template>
  <div
    v-show="visible"
    class="wf-loading-bar"
    role="progressbar"
    :aria-label="label ?? 'جارٍ التحديث'"
  >
    <span class="wf-loading-bar__track" />
  </div>
</template>

<style scoped>
.wf-loading-bar {
  position: relative;
  block-size: 2px;
  inline-size: 100%;
  overflow: hidden;
  background: var(--wf-surface-sunken);
}
.wf-loading-bar__track {
  position: absolute;
  inset-block: 0;
  inline-size: 40%;
  background: var(--wf-primary);
  animation: wf-loading 900ms var(--wf-ease-standard) infinite;
}
@keyframes wf-loading {
  from {
    inset-inline-start: -40%;
  }
  to {
    inset-inline-start: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wf-loading-bar__track {
    animation: none;
    inline-size: 100%;
  }
}
</style>
