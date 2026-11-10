<!-- The frame's header: logo/home at inline-start; notifications, the theme switch, and the account control (or the guest's sign-in action) at inline-end, with the blocked ended-session state carrying the logo/home control and the theme switch alone, all kept in one row at 320 CSS px (FR-023, FR-049, AC-025, AC-053, contracts/ui-contracts.md §8.3–§8.4). -->
<script setup lang="ts">
import { bareRoutes } from '@wafar/shared';
import WfWordmark from '../WfWordmark.vue';
import WfIcon from '../WfIcon.vue';
import WfAccountMenu from './WfAccountMenu.vue';
import WfThemeSwitch from './WfThemeSwitch.vue';

withDefaults(defineProps<{ signedIn?: boolean; blocked?: boolean }>(), {
  signedIn: false,
  blocked: false,
});

const emit = defineEmits<{ signOut: [] }>();
</script>

<template>
  <header class="wf-shell-header">
    <div class="wf-shell-header__start">
      <WfWordmark as="link" />
    </div>
    <div class="wf-shell-header__end">
      <NuxtLink
        v-if="signedIn && !blocked"
        class="wf-shell-header__notifications"
        to="/notifications"
        aria-label="الإشعارات"
      >
        <WfIcon name="bell" />
      </NuxtLink>
      <WfThemeSwitch />
      <WfAccountMenu
        v-if="signedIn && !blocked"
        @sign-out="emit('signOut')"
      />
      <NuxtLink
        v-else-if="!blocked"
        class="wf-shell-header__signin"
        :to="bareRoutes.signIn"
      >
        تسجيل الدخول
      </NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.wf-shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wf-space-2);
  block-size: var(--wf-header-height);
  padding-inline: var(--wf-space-3);
  border-block-end: var(--wf-border-width) solid var(--wf-border);
  background: var(--wf-surface);
  position: sticky;
  inset-block-start: 0;
  z-index: var(--wf-z-header);
}
.wf-shell-header__start,
.wf-shell-header__end {
  display: flex;
  align-items: center;
  gap: var(--wf-space-2);
  min-inline-size: 0;
  flex-wrap: nowrap;
}
.wf-shell-header__notifications,
.wf-shell-header__signin {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-1);
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
  text-decoration: none;
  min-block-size: var(--wf-touch-floor);
  min-inline-size: var(--wf-touch-floor);
  justify-content: center;
}
@media (max-width: 359px) {
  .wf-shell-header {
    padding-inline: var(--wf-space-2);
  }
  .wf-shell-header__signin {
    padding-inline: var(--wf-space-2);
  }
}
</style>
