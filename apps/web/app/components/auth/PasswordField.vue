<!-- The password field: the policy statement above it and one message per reason, its two numerals filled from the shared limits (FR-035, AC-037). -->
<script setup lang="ts">
import { useId } from 'vue';
import MessageAlert from './MessageAlert.vue';
import { notices } from '../../composables/auth/useAuthMessages';

withDefaults(
  defineProps<{
    modelValue: string;
    message?: string;
    label?: string;
    autocomplete?: string;
    /** The sign-in form applies no password rule and states none (FR-051). */
    showPolicy?: boolean;
  }>(),
  { message: '', label: 'كلمة المرور', autocomplete: 'new-password', showPolicy: true },
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const fieldId = useId();
const messageId = useId();
</script>

<template>
  <div class="wf-password">
    <label class="wf-password__label" :for="fieldId">{{ label }}</label>
    <p v-if="showPolicy !== false" class="wf-password__policy">{{ notices.passwordPolicy }}</p>
    <input
      :id="fieldId"
      :value="modelValue"
      type="password"
      :autocomplete="autocomplete"
      :aria-invalid="message !== ''"
      :aria-describedby="message !== '' ? messageId : undefined"
      required
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <MessageAlert :id="messageId" :message="message ?? ''" kind="alert" />
  </div>
</template>

<style scoped>
.wf-password {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-1);
}
.wf-password__label {
  font-weight: var(--wf-weight-medium);
}
.wf-password__policy {
  margin: 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-password input {
  min-block-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-3);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  font: inherit;
}
</style>
