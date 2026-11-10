<!-- The content skeleton: its geometry equals the content's, one Arabic sentence per region, and the shimmer derives from the ink token (ADR-128 §9). -->
<script setup lang="ts">
withDefaults(
  defineProps<{ rows?: number; label?: string; compact?: boolean }>(),
  { rows: 3, label: 'جارٍ تحميل المحتوى', compact: false },
);
</script>

<template>
  <div class="wf-skeleton" role="status" :aria-label="label">
    <span class="wf-skeleton__line wf-skeleton__line--title" />
    <span
      v-for="row in rows"
      :key="row"
      :class="['wf-skeleton__line', { 'wf-skeleton__line--compact': compact }]"
    />
    <span class="wf-skeleton__sentence">{{ label }}</span>
  </div>
</template>

<style scoped>
.wf-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-2);
  inline-size: 100%;
}
.wf-skeleton__line {
  display: block;
  block-size: 1rem;
  border-radius: var(--wf-radius);
  background: linear-gradient(
    var(--wf-shimmer-angle),
    var(--wf-shimmer-from),
    var(--wf-shimmer-to),
    var(--wf-shimmer-from)
  );
  background-size: 200% 100%;
  animation: wf-shimmer 1.2s linear infinite;
}
.wf-skeleton__line--title {
  block-size: 1.5rem;
  inline-size: 40%;
}
.wf-skeleton__line--compact {
  inline-size: 70%;
}
.wf-skeleton__sentence {
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
@keyframes wf-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wf-skeleton__line {
    animation: none;
  }
}
</style>
