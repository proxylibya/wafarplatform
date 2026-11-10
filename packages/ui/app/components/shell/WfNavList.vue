<!-- The nine-destination navigation list: one entry per destination, each label carried whole as the link's accessible name, and a guest sent to the sign-in page from a merchant-area destination (FR-039, FR-048). -->
<script setup lang="ts">
import { destinationFor, sidebarDestinations } from '@wafar/shared';
import WfIcon from '../WfIcon.vue';
import type { WfIconName } from '../../types/icon.ts';

withDefaults(defineProps<{ guest?: boolean; collapsed?: boolean }>(), {
  guest: false,
  collapsed: false,
});

const emit = defineEmits<{ navigate: [] }>();

const icons: Record<string, WfIconName> = {
  home: 'home',
  parts: 'parts',
  catalogs: 'catalogs',
  upload: 'upload',
  'my-files': 'my-files',
  cart: 'cart',
  notifications: 'notifications',
  messages: 'messages',
  profile: 'profile',
};
</script>

<template>
  <ul class="wf-nav-list">
    <li v-for="item in sidebarDestinations" :key="item.key">
      <NuxtLink
        :to="destinationFor(item.path, guest)"
        class="wf-nav-list__item"
        :title="collapsed ? item.label : undefined"
        @click="emit('navigate')"
      >
        <WfIcon :name="icons[item.key] ?? 'home'" />
        <span class="wf-nav-list__label">{{ item.label }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
.wf-nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-1);
  list-style: none;
  margin: 0;
  padding: 0;
}
.wf-nav-list__item {
  display: flex;
  align-items: center;
  gap: var(--wf-space-2);
  inline-size: 100%;
  min-block-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-2);
  border-radius: var(--wf-radius);
  color: var(--wf-ink-muted);
  text-decoration: none;
}
.wf-nav-list__item:hover {
  background: var(--wf-surface-muted);
  color: var(--wf-ink);
}
.wf-nav-list__label {
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
