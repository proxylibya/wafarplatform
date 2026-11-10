<!-- The bidirectional file-name surface: the Latin extension is isolated inside an Arabic name so it renders in reading order (ADR-128 §14). -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ name: string }>();

const parts = computed(() => {
  const match = /^(.*?)(\.[A-Za-z0-9]+)$/.exec(props.name);
  if (match === null) return { stem: props.name, extension: '' };
  return { stem: match[1] ?? props.name, extension: match[2] ?? '' };
});
</script>

<template>
  <span class="wf-file-name">
    <bdi class="wf-file-name__stem">{{ parts.stem }}</bdi>
    <bdi v-if="parts.extension" class="wf-file-name__extension" dir="ltr">{{
      parts.extension
    }}</bdi>
  </span>
</template>

<style scoped>
.wf-file-name {
  display: inline-flex;
  max-inline-size: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wf-file-name__extension {
  direction: ltr;
  unicode-bidi: isolate;
}
</style>
