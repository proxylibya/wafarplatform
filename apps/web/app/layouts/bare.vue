<!-- The bare layout: the non-interactive wordmark, the page title, the card, and the cross-links. It carries no frame (FR-021, FR-036, AC-023, AC-039). -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{ title: string; subtitle?: string; showCrossLinks?: boolean }>(),
  { subtitle: '', showCrossLinks: true },
);

useHead(() => ({ title: props.title }));
</script>

<template>
  <div class="bare-layout">
    <div class="bare-layout__inner">
      <div class="bare-layout__mark">
        <WfWordmark as="mark" :shorten-at-narrow="false" />
      </div>
      <h1 class="bare-layout__title">{{ title }}</h1>
      <p v-if="subtitle" class="bare-layout__subtitle">{{ subtitle }}</p>
      <main class="bare-layout__card">
        <slot />
      </main>
      <nav v-if="props.showCrossLinks" class="bare-layout__links" aria-label="روابط الصفحة">
        <slot name="cross-links" />
      </nav>
    </div>
  </div>
</template>

<style scoped>
.bare-layout {
  display: flex;
  min-block-size: 100vh;
  align-items: center;
  justify-content: center;
  padding: var(--wf-space-4);
  background: var(--wf-surface-muted);
}
.bare-layout__inner {
  inline-size: 100%;
  max-inline-size: 26rem;
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-4);
}
.bare-layout__mark {
  display: flex;
  justify-content: center;
}
.bare-layout__title {
  margin: 0;
  font-size: var(--wf-text-xl);
  font-weight: var(--wf-weight-semibold);
  text-align: center;
}
.bare-layout__subtitle {
  margin: calc(-1 * var(--wf-space-2)) 0 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
  text-align: center;
}
.bare-layout__card {
  padding: var(--wf-space-5);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  background: var(--wf-surface);
}
.bare-layout__links {
  display: flex;
  justify-content: center;
  gap: var(--wf-space-4);
  font-size: var(--wf-text-sm);
}
.bare-layout__links :deep(a) {
  color: var(--wf-primary);
  min-block-size: var(--wf-touch-floor);
  display: inline-flex;
  align-items: center;
}
</style>
