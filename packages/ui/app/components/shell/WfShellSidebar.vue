<!-- The sidebar: the nine destinations, the collapse control, and — in the drawer — the four static-page links. The rail is the layer's rail-width token (FR-022, FR-024, FR-039, contracts/ui-contracts.md §8.3). -->
<script setup lang="ts">
import { ref } from 'vue';
import { footerLinks } from '@wafar/shared';
import WfIcon from '../WfIcon.vue';
import WfNavList from './WfNavList.vue';

const props = withDefaults(
  defineProps<{ drawer?: boolean; guest?: boolean; open?: boolean }>(),
  { drawer: false, guest: false, open: true },
);

const emit = defineEmits<{ close: []; navigate: [] }>();

const collapsed = ref(false);

function collapse(): void {
  if (props.drawer) {
    emit('close');
    return;
  }
  collapsed.value = !collapsed.value;
}

function navigate(): void {
  emit('navigate');
}
</script>

<template>
  <nav
    class="wf-shell-sidebar"
    :class="{ 'wf-shell-sidebar--collapsed': collapsed && !drawer }"
    aria-label="القائمة"
  >
    <WfNavList :guest="guest" :collapsed="collapsed && !drawer" @navigate="navigate" />

    <div v-if="drawer" class="wf-shell-sidebar__footer">
      <NuxtLink v-for="link in footerLinks" :key="link.key" :to="link.path" class="wf-shell-sidebar__footer-link">
        {{ link.label }}
      </NuxtLink>
    </div>

    <button
      type="button"
      class="wf-shell-sidebar__collapse"
      :aria-expanded="drawer ? (open ?? true) : !collapsed"
      @click="collapse"
    >
      <WfIcon :name="drawer ? 'close' : 'collapse'" />
      <span v-if="!collapsed || drawer" class="wf-shell-sidebar__label">
        {{ drawer ? 'إغلاق القائمة' : collapsed ? 'توسيع القائمة' : 'طي القائمة' }}
      </span>
      <span v-else class="wf-shell-sidebar__label wf-sr-only">
        {{ collapsed ? 'توسيع القائمة' : 'طي القائمة' }}
      </span>
    </button>
  </nav>
</template>

<style scoped>
.wf-shell-sidebar {
  inline-size: var(--wf-sidebar-width);
  block-size: 100%;
  padding: var(--wf-space-3);
  border-inline-end: var(--wf-border-width) solid var(--wf-border);
  background: var(--wf-surface);
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-2);
}
.wf-shell-sidebar--collapsed {
  inline-size: var(--wf-rail-width);
}
.wf-shell-sidebar--collapsed :deep(.wf-nav-list__label) {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.wf-shell-sidebar__collapse {
  display: flex;
  align-items: center;
  gap: var(--wf-space-2);
  inline-size: 100%;
  min-block-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-2);
  border: 0;
  border-radius: var(--wf-radius);
  background: transparent;
  color: var(--wf-ink-muted);
  font: inherit;
  cursor: pointer;
  margin-block-start: auto;
}
.wf-shell-sidebar__collapse:hover {
  background: var(--wf-surface-muted);
  color: var(--wf-ink);
}
.wf-shell-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-1);
  padding-block-start: var(--wf-space-3);
  border-block-start: var(--wf-border-width) solid var(--wf-border);
}
.wf-shell-sidebar__footer-link {
  min-block-size: var(--wf-touch-floor);
  display: inline-flex;
  align-items: center;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
  text-decoration: none;
}
.wf-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
