<!-- The sign-up form: the fixed +218 prefix and no dial-code selector, the value rules applied before submission, the honeypot, and the form stamp it holds and submits unchanged (FR-001, FR-002, FR-003, FR-005, FR-026, FR-029, FR-042). -->
<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import {
  hasEmoji,
  validateSignUpValues,
  type FieldFailure,
} from '@wafar/shared';
import CityCombobox from './CityCombobox.vue';
import PasswordField from './PasswordField.vue';
import MessageAlert from './MessageAlert.vue';
import { messageFor } from '../../composables/auth/useAuthMessages';

const props = defineProps<{
  formStamp: string;
  loading: boolean;
  message?: string;
  /** The values the first step is returned to after a request ended. */
  initial?: {
    fullName?: string;
    phone?: string;
    city?: string;
    shopName?: string;
  };
  /** The field a refusal names, so focus moves to it (FR-040, AC-043). */
  refusedField?: string | null;
}>();
const emit = defineEmits<{
  submit: [
    payload: {
      fullName: string;
      phone: string;
      password: string;
      city: string;
      shopName?: string;
      website: string;
      formStamp: string;
    },
  ];
}>();

const fullName = ref(props.initial?.fullName ?? '');
const phone = ref(props.initial?.phone ?? '');
const password = ref('');
const city = ref(props.initial?.city ?? '');
const shopName = ref(props.initial?.shopName ?? '');
const website = ref('');
const failures = ref<FieldFailure[]>([]);

// A refusal never re-displays a password: the field clears when the message
// arrives, while every other value stays as typed (FR-038, AC-041).
watch(
  () => props.message,
  (value) => {
    if (value !== undefined && value !== '') password.value = '';
  },
);

// A refusal is announced as an alert and focus moves to the field it names, or
// to the submit control when the refusal names no form field (FR-040, AC-043).
watch(
  () => props.refusedField,
  async (field) => {
    if (field === undefined || field === null) return;
    await nextTick();
    const target =
      field === 'fullName'
        ? 'input[autocomplete="name"]'
        : field === 'phone'
          ? 'input[autocomplete="tel-national"]'
          : field === 'password'
            ? 'input[type="password"]'
            : field === 'city'
              ? '#wf-city-input'
              : field === 'shopName'
                ? 'input[autocomplete="organization"]'
                : 'button.wf-submit';
    document.querySelector<HTMLElement>(target)?.focus();
  },
);

function failureFor(field: string): string {
  const failure = failures.value.find((entry) => entry.field === field);
  if (failure === undefined) return '';
  return messageFor({
    code: failure.code,
    ...(failure.reason === undefined ? {} : { reason: failure.reason }),
  });
}

function submit(): void {
  failures.value = validateSignUpValues({
    fullName: fullName.value,
    phone: `+218${phone.value.replace(/\D/g, '')}`,
    password: password.value,
    city: city.value,
    ...(shopName.value.trim() === '' ? {} : { shopName: shopName.value }),
  });
  if (hasEmoji(fullName.value)) {
    failures.value.push({
      code: 'INVALID_FULL_NAME',
      field: 'fullName',
      reason: 'emoji',
    });
  }
  if (failures.value.length > 0) return;

  emit('submit', {
    fullName: fullName.value.trim(),
    phone: phone.value,
    password: password.value,
    city: city.value,
    ...(shopName.value.trim() === '' ? {} : { shopName: shopName.value.trim() }),
    website: website.value,
    formStamp: props.formStamp,
  });
}
</script>

<template>
  <form class="wf-sign-up" novalidate @submit.prevent="submit">
    <MessageAlert :message="message ?? ''" kind="alert" />

    <label class="wf-field">
      <span>الاسم الكامل</span>
      <input v-model="fullName" type="text" autocomplete="name" required />
      <span v-if="failureFor('fullName')" role="alert" class="wf-field__error">{{
        failureFor('fullName')
      }}</span>
    </label>

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
      <span v-if="failureFor('phone')" role="alert" class="wf-field__error">{{
        failureFor('phone')
      }}</span>
    </label>

    <PasswordField v-model="password" :message="failureFor('password')" />

    <CityCombobox v-model="city" :message="failureFor('city')" />

    <label class="wf-field">
      <span>
        اسم المحل
        <span class="wf-field__optional">اختياري</span>
      </span>
      <input v-model="shopName" type="text" autocomplete="organization" />
      <span v-if="failureFor('shopName')" role="alert" class="wf-field__error">{{
        failureFor('shopName')
      }}</span>
    </label>

    <div class="wf-honeypot" aria-hidden="true">
      <input
        v-model="website"
        name="website"
        type="text"
        tabindex="-1"
        autocomplete="off"
      />
    </div>

    <button type="submit" class="wf-submit" :disabled="loading">
      {{ loading ? 'يجري الإرسال…' : 'إرسال رمز التحقق' }}
    </button>

    <p class="wf-sign-up__footnote">
      سيصلك الرمز برسالة <span lang="en">SMS</span> إلى الرقم نفسه، ودخول الحساب
      الموثق لا يحتاج رمزا.
    </p>
  </form>
</template>

<style scoped>
.wf-sign-up {
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
.wf-field__optional {
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-sign-up__footnote {
  margin: 0;
  color: var(--wf-ink-muted);
  font-size: var(--wf-text-sm);
}
.wf-honeypot {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
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
.wf-submit:disabled {
  opacity: 0.6;
  cursor: progress;
}
</style>
