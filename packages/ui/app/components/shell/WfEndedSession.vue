<!-- The ended-session state: one state for every session ending, in two variants, announced ahead of the page's other announcements with its heading focused (FR-049, contracts/ui-contracts.md §8.4). -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { bareRoutes } from '@wafar/shared';

withDefaults(defineProps<{ variant?: 'ended' | 'blocked' }>(), {
  variant: 'ended',
});

const heading = ref<HTMLElement | null>(null);
onMounted(() => heading.value?.focus());
</script>

<template>
  <section class="wf-ended-session" role="status" aria-live="polite" aria-atomic="true">
    <h2 ref="heading" class="wf-ended-session__heading" tabindex="-1">
      {{ variant === 'blocked' ? 'الحساب موقوف' : 'انتهت الجلسة' }}
    </h2>
    <p class="wf-ended-session__body">
      {{
        variant === 'blocked'
          ? 'أوقفت الإدارة هذا الحساب، ولن يقبل تسجيل الدخول حتى يعاد تفعيله.'
          : 'انتهت جلستك. سجل الدخول من جديد للمتابعة.'
      }}
    </p>
    <NuxtLink
      v-if="variant !== 'blocked'"
      class="wf-ended-session__signin"
      :to="bareRoutes.signIn"
    >
      تسجيل الدخول
    </NuxtLink>
  </section>
</template>

<style scoped>
.wf-ended-session {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-3);
  max-inline-size: 32rem;
  margin-inline: auto;
  padding: var(--wf-space-6);
}
.wf-ended-session__heading {
  margin: 0;
  font-size: var(--wf-text-xl);
}
.wf-ended-session__heading:focus-visible {
  outline: var(--wf-focus-ring);
  outline-offset: 2px;
}
.wf-ended-session__body {
  margin: 0;
  color: var(--wf-ink-muted);
}
.wf-ended-session__signin {
  align-self: flex-start;
  min-block-size: var(--wf-touch-floor);
  display: inline-flex;
  align-items: center;
  color: var(--wf-primary);
}
</style>
