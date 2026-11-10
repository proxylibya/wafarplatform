<!-- The one appearance control: its state is carried by name and `aria-pressed`, never by colour alone (ADR-128, contracts/ui-contracts.md §8.5). -->
<script setup lang="ts">
import { onMounted } from 'vue';
import WfIcon from '../WfIcon.vue';
import { useAppearance } from '../../composables/useAppearance.ts';

const { appearance, init, toggle } = useAppearance();
onMounted(init);
</script>

<template>
  <button
    type="button"
    class="wf-theme-switch"
    :aria-pressed="appearance === 'dark'"
    :aria-label="
      appearance === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'
    "
    @click="toggle"
  >
    <WfIcon :name="appearance === 'dark' ? 'sun' : 'moon'" />
    <span class="wf-theme-switch__label">
      {{ appearance === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن' }}
    </span>
  </button>
</template>

<style scoped>
.wf-theme-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-1);
  min-block-size: var(--wf-touch-floor);
  min-inline-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-2);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  background: transparent;
  color: var(--wf-ink-muted);
  font: inherit;
  cursor: pointer;
}
@media (max-width: 359px) {
  .wf-theme-switch__label {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
