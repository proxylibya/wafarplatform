<!-- The sign-in form: the number, the password, and one uniform failure text with no lock or block copy (FR-002, FR-007, FR-008, FR-042). -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { validateSignInValues } from '@wafar/shared';
import PasswordField from './PasswordField.vue';
import MessageAlert from './MessageAlert.vue';
import { messageFor } from '../../composables/auth/useAuthMessages';

const props = defineProps<{ loading: boolean; message?: string }>();
const emit = defineEmits<{ submit: [payload: { phone: string; password: string }] }>();

const phone = ref('');
const password = ref('');
const phoneMessage = ref('');

// A refusal clears the password and keeps the number (FR-038, AC-041).
watch(
  () => props.message,
  (value) => {
    if (value !== undefined && value !== '') password.value = '';
  },
);

function submit(): void {
  const failures = validateSignInValues({ phone: `+218${phone.value}`, password: password.value });
  phoneMessage.value =
    failures.length === 0 ? '' : messageFor({ code: failures[0]?.code ?? 'INVALID_PHONE' });
  if (failures.length > 0) return;
  emit('submit', { phone: phone.value, password: password.value });
}
</script>

<template>
  <form class="wf-sign-in" novalidate @submit.prevent="submit">
    <MessageAlert :message="props.message ?? ''" kind="alert" />

    <label class="wf-field">
      <span>رقم الهاتف</span>
      <span class="wf-field__phone">
        <span class="wf-field__prefix" dir="ltr">+218</span>
        <input
          v-model="phone"
          type="tel"
          inputmode="numeric"
          autocomplete="tel-national"
          placeholder="91 000 0000"
          required
        />
      </span>
      <span v-if="phoneMessage" role="alert" class="wf-field__error">{{ phoneMessage }}</span>
    </label>

    <PasswordField
      v-model="password"
      label="كلمة المرور"
      autocomplete="current-password"
      :show-policy="false"
    />

    <button type="submit" class="wf-submit" :disabled="loading">
      {{ loading ? 'يجري تسجيل الدخول…' : 'تسجيل الدخول' }}
    </button>
  </form>
</template>

<style scoped>
.wf-sign-in {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-4);
}
.wf-field {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-1);
}
.wf-field input {
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-3);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  font: inherit;
}
.wf-field__phone {
  display: flex;
  align-items: center;
  gap: var(--wf-space-2);
}
.wf-field__prefix {
  font-family: var(--wf-font-mono);
}
.wf-field__phone input {
  flex: 1 1 auto;
  inline-size: auto;
  min-inline-size: 0;
}
.wf-field__error {
  color: var(--wf-danger);
  font-size: var(--wf-text-sm);
}
.wf-submit {
  min-block-size: var(--wf-touch-floor);
  border: 0;
  border-radius: var(--wf-radius);
  background: var(--wf-primary);
  color: var(--wf-primary-contrast);
  font: inherit;
  font-weight: var(--wf-weight-semibold);
  cursor: pointer;
}
</style>
