<!-- The shared code step both identity flows consume: the collected fields in their own scripts and directions, the code field, resend, and the change-number control, parameterized so neither flow edits it (FR-038, FR-045, AC-041). -->
<script setup lang="ts">
import { onMounted, ref, useId } from 'vue';
import { otpLength } from '@wafar/shared';
import MessageAlert from './MessageAlert.vue';
import { notices } from '../../composables/auth/useAuthMessages';

export interface CollectedField {
  label: string;
  value: string;
  /** True when the value must render as one isolated left-to-right run. */
  ltr?: boolean;
}

withDefaults(
  defineProps<{
    codeMessage?: string;
    codeMessageKind?: 'status' | 'alert';
    statusMessage?: string;
    collected: CollectedField[];
    displayPhone: string;
    remainingReRequests: number;
    loading: boolean;
    resending?: boolean;
    canChangeNumber?: boolean;
    canResend?: boolean;
    changeLabel?: string;
  }>(),
  {
    codeMessage: '',
    codeMessageKind: 'alert',
    statusMessage: '',
    resending: false,
    canChangeNumber: true,
    canResend: true,
    changeLabel: 'تعديل البيانات',
  },
);

const emit = defineEmits<{
  verify: [code: string];
  resend: [];
  changeNumber: [];
}>();

const code = ref('');
const fieldId = useId();
const field = ref<HTMLInputElement | null>(null);

// The code step opens with focus on its field, so the six digits are the next
// thing a keyboard reaches (AC-041).
onMounted(() => field.value?.focus());

function submit(): void {
  emit('verify', code.value);
  code.value = '';
}
</script>

<template>
  <section class="wf-code-step" aria-labelledby="wf-code-heading">
    <h2 id="wf-code-heading" class="wf-code-step__heading">{{ notices.codeHeading }}</h2>
    <p class="wf-code-step__body">
      أرسلنا رمزا من {{ otpLength }} أرقام برسالة <span lang="en">SMS</span> إلى رقمك.
    </p>

    <dl class="wf-code-step__collected">
      <template v-for="field in collected" :key="field.label">
        <dt>{{ field.label }}</dt>
        <dd>
          <bdi :dir="field.ltr === true ? 'ltr' : 'auto'">{{ field.value }}</bdi>
        </dd>
      </template>
      <dt>رقم الهاتف</dt>
      <dd><bdi dir="ltr">{{ displayPhone }}</bdi></dd>
    </dl>

    <MessageAlert :message="statusMessage ?? ''" kind="status" />
    <MessageAlert :message="codeMessage ?? ''" :kind="codeMessageKind ?? 'alert'" />

    <form class="wf-code-step__form" novalidate @submit.prevent="submit">
      <label class="wf-code-step__label" :for="fieldId">{{ notices.codeLabel }}</label>
      <span class="wf-code-step__hint">{{ notices.codeHint }}</span>
      <input
        :id="fieldId"
        ref="field"
        v-model="code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        :maxlength="otpLength"
        :aria-invalid="(codeMessage ?? '') !== ''"
        required
      />
      <p class="wf-code-step__hint">{{ notices.expiryHint }}</p>
      <button type="submit" class="wf-code-step__submit" :disabled="loading">
        {{ loading && resending !== true ? notices.verifying : 'تحقق' }}
      </button>
    </form>

    <div class="wf-code-step__actions">
      <button
        v-if="canResend !== false"
        type="button"
        :disabled="loading || resending || remainingReRequests === 0"
        @click="emit('resend')"
      >
        {{ resending ? notices.resending : 'إرسال رمز جديد' }}
      </button>
      <button v-if="canChangeNumber !== false" type="button" @click="emit('changeNumber')">
        {{ changeLabel }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.wf-code-step {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-3);
}
.wf-code-step__heading {
  margin: 0;
  font-size: var(--wf-text-lg);
}
.wf-code-step__body {
  margin: 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-code-step__collected {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--wf-space-1) var(--wf-space-3);
  margin: 0;
}
.wf-code-step__collected dt {
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-code-step__collected dd {
  margin: 0;
}
.wf-code-step__form {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-2);
}
.wf-code-step__label {
  font-weight: var(--wf-weight-medium);
}
.wf-code-step__form input {
  min-block-size: var(--wf-touch-floor);
  padding-inline: var(--wf-space-3);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  font-family: var(--wf-font-mono);
  font-size: var(--wf-text-lg);
  direction: ltr;
}
.wf-code-step__hint {
  margin: 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-code-step__submit,
.wf-code-step__actions button {
  min-block-size: var(--wf-touch-floor);
  border: var(--wf-border-width) solid var(--wf-border);
  border-radius: var(--wf-radius);
  background: var(--wf-surface);
  color: var(--wf-ink);
  font: inherit;
}
.wf-code-step__submit {
  background: var(--wf-primary);
  border-color: var(--wf-primary);
  color: var(--wf-primary-contrast);
  font-weight: var(--wf-weight-semibold);
}
.wf-code-step__actions {
  display: flex;
  gap: var(--wf-space-3);
}
</style>
