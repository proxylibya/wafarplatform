<!-- The recovery flow's new-password step: the policy statement, the field, and the guarded submit (FR-014, FR-040, AC-016, AC-043). -->
<script setup lang="ts">
import { onMounted } from 'vue';
import MessageAlert from './MessageAlert.vue';
import PasswordField from './PasswordField.vue';
import { notices } from '../../composables/auth/useAuthMessages';

defineProps<{ modelValue: string; message?: string; loading: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: string];
  submit: [];
}>();

// The step replaces the code step and carries a field, so focus moves to that
// field rather than to its heading (FR-040, AC-043).
onMounted(() => {
  document.querySelector<HTMLInputElement>('.wf-new-password input')?.focus();
});

function update(value: string): void {
  emit('update:modelValue', value);
}
</script>

<template>
  <section class="wf-new-password">
    <h2>كلمة مرور جديدة</h2>
    <MessageAlert :message="message ?? ''" kind="alert" />
    <PasswordField
      :model-value="modelValue"
      label="كلمة المرور الجديدة"
      @update:model-value="update"
    />
    <button
      type="button"
      class="wf-new-password__submit"
      :disabled="loading"
      @click="emit('submit')"
    >
      {{ loading ? notices.settingProgress : 'تعيين كلمة المرور' }}
    </button>
  </section>
</template>

<style scoped>
.wf-new-password {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-3);
}
.wf-new-password__submit {
  min-block-size: var(--wf-touch-floor);
  border: 0;
  border-radius: var(--wf-radius);
  background: var(--wf-primary);
  color: var(--wf-primary-contrast);
  font: inherit;
  font-weight: var(--wf-weight-semibold);
}
</style>
