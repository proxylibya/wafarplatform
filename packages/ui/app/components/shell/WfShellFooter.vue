<!-- The footer band: the brand line at the inline-start and the four static-page links at the inline-end, absent below 1024 px (FR-024, AC-026, contracts/ui-contracts.md §8.3). -->
<script setup lang="ts">
import { footerLinks } from '@wafar/shared';

withDefaults(defineProps<{ links?: typeof footerLinks }>(), {
  links: () => footerLinks,
});
</script>

<template>
  <footer class="wf-shell-footer">
    <p class="wf-shell-footer__brand">منصة وفر — كتالوج قطع الغيار</p>
    <nav aria-label="روابط ثابتة">
      <ul class="wf-shell-footer__list">
        <li v-for="link in links" :key="link.key">
          <NuxtLink :to="link.path">{{ link.label }}</NuxtLink>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<style scoped>
.wf-shell-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wf-space-4);
  min-block-size: var(--wf-footer-height);
  padding-inline: var(--wf-space-4);
  border-block-start: var(--wf-border-width) solid var(--wf-border);
  background: var(--wf-surface-muted);
}
.wf-shell-footer__brand {
  margin: 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
  white-space: nowrap;
}
.wf-shell-footer__list {
  display: flex;
  gap: var(--wf-space-4);
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wf-shell-footer__list a {
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
  text-decoration: none;
  min-block-size: var(--wf-touch-floor);
  display: inline-flex;
  align-items: center;
}
@media (max-width: 1023px) {
  .wf-shell-footer {
    display: none;
  }
}
</style>
