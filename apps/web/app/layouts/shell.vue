<!-- The frame's page layout: header, sidebar, content, footer band, the drawer on a narrow screen, and the bottom bar. The layout owns the drawer's open state, so «المزيد» opens it and the recorded dismissals close it (FR-022, FR-039, FR-048, FR-052; R1 ships no page that renders it, EX-007). -->
<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{ signedIn?: boolean; blocked?: boolean; fullName?: string }>(),
  {
    signedIn: false,
    blocked: false,
    fullName: '',
  },
);

const drawerOpen = ref(false);
</script>

<template>
  <div class="shell-layout">
    <WfShellHeader :signed-in="props.signedIn" :blocked="props.blocked" :full-name="props.fullName" />
    <div class="shell-layout__body">
      <div class="shell-layout__sidebar">
        <WfShellSidebar :guest="!props.signedIn" />
      </div>
      <main id="main" class="shell-layout__main">
        <slot />
      </main>
    </div>
    <WfShellFooter />
    <WfShellBottomBar
      :guest="!props.signedIn"
      :drawer-open="drawerOpen"
      @open-drawer="drawerOpen = true"
    />
    <WfShellDrawer
      :open="drawerOpen"
      :guest="!props.signedIn"
      @close="drawerOpen = false"
    />
  </div>
</template>

<style scoped>
.shell-layout {
  display: flex;
  flex-direction: column;
  min-block-size: 100vh;
  padding-block-end: var(--wf-bottom-bar-height);
}
.shell-layout__body {
  display: flex;
  flex: 1;
  align-items: stretch;
}
.shell-layout__sidebar {
  display: none;
}
.shell-layout__main {
  flex: 1;
  inline-size: 100%;
  max-inline-size: var(--wf-content-max);
  margin-inline: auto;
  padding: var(--wf-space-5);
}
@media (min-width: 1024px) {
  .shell-layout {
    padding-block-end: 0;
  }
  .shell-layout__sidebar {
    display: block;
  }
}
</style>
