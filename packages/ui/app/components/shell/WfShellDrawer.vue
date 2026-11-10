<!-- The drawer: the sidebar on a narrow screen. «المزيد» opens it; the collapse control, Escape, and an activation outside close it and return focus to «المزيد»; activating a destination closes it as part of the navigation (FR-022, FR-052, contracts/ui-contracts.md §8.3). -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import WfShellSidebar from './WfShellSidebar.vue';

const props = withDefaults(
  defineProps<{ open?: boolean; guest?: boolean }>(),
  { open: false, guest: false },
);

const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);

function returnFocus(): void {
  const trigger = document.querySelector<HTMLElement>('[data-slot="more"]');
  trigger?.focus();
}

function close(): void {
  emit('close');
  returnFocus();
}

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) {
    event.stopPropagation();
    close();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    await nextTick();
    const first = panel.value?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    first?.focus();
  },
);

onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div v-if="open" class="wf-shell-drawer__overlay" @click.self="close">
    <div
      id="wf-drawer"
      ref="panel"
      class="wf-shell-drawer__panel"
      role="dialog"
      aria-modal="true"
      aria-label="قائمة التنقل"
    >
      <WfShellSidebar drawer :open="open" :guest="guest" @close="close" @navigate="emit('close')" />
    </div>
  </div>
</template>

<style scoped>
.wf-shell-drawer__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--wf-z-drawer);
  background: rgb(16 20 24 / 45%);
}
.wf-shell-drawer__panel {
  inline-size: var(--wf-sidebar-width);
  block-size: 100%;
  background: var(--wf-surface);
}
</style>
