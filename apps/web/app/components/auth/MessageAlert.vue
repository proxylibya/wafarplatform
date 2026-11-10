<!-- One announcement region: a refusal is an alert and a status notice is polite, so the two are never announced alike (FR-040, AC-043). -->
<script setup lang="ts">
withDefaults(defineProps<{ id?: string; message: string; kind?: 'status' | 'alert' }>(), {
  id: undefined,
  kind: 'status',
});
</script>

<template>
  <p
    v-if="message"
    :id="id"
    :role="kind === 'alert' ? 'alert' : 'status'"
    :class="['wf-message', kind === 'alert' ? 'wf-message--alert' : 'wf-message--status']"
  >
    {{ message }}
  </p>
</template>

<style scoped>
.wf-message {
  margin: 0 0 var(--wf-space-3);
  padding: var(--wf-space-2) var(--wf-space-3);
  border-radius: var(--wf-radius);
  font-size: var(--wf-text-sm);
}
.wf-message--alert {
  background: var(--wf-danger-soft);
  color: var(--wf-danger);
}
.wf-message--status {
  background: var(--wf-surface-sunken);
  color: var(--wf-ink);
}
</style>
