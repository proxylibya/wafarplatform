<!-- The recovery request form: the number alone, and a response that is the same whether or not the number has an account (FR-014, FR-015). -->
<script setup lang="ts">
import { ref } from 'vue';
import { normalizePhone } from '@wafar/shared';
import MessageAlert from './MessageAlert.vue';

const props = defineProps<{
  loading: boolean;
  message?: string;
  /** The number the flow was resumed with, kept when an expiry returns here. */
  initialPhone?: string;
}>();
const emit = defineEmits<{ submit: [payload: { phone: string }] }>();

const phone = ref(props.initialPhone ?? '');
const localMessage = ref('');

function submit(): void {
  const normalized = normalizePhone(`+218${phone.value}`);
  localMessage.value =
    normalized === null ? 'أدخل رقم هاتف ليبي صحيحا يبدأ بـ +218.' : '';
  if (normalized === null) return;
  emit('submit', { phone: phone.value });
}
</script>

<template>
  <form class="wf-forgot" novalidate @submit.prevent="submit">
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
      <span v-if="localMessage" role="alert" class="wf-field__error">{{ localMessage }}</span>
    </label>
    <button type="submit" class="wf-submit" :disabled="loading">
      {{ loading ? 'يجري الإرسال…' : 'إرسال رمز التحقق' }}
    </button>
  </form>
</template>

<style scoped>
.wf-forgot {
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
}
</style>
