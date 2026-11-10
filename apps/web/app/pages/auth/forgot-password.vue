<!-- The recovery page: the request, the code, and the new password, with every outcome stated and never a hint whether the number has an account (FR-014, FR-015, AC-036, AC-041). -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { formatPhoneForDisplay } from '@wafar/shared';
import RecoveryForm from '../../components/auth/RecoveryForm.vue';
import CodeStep from '../../components/auth/CodeStep.vue';
import NewPasswordStep from '../../components/auth/NewPasswordStep.vue';
import MessageAlert from '../../components/auth/MessageAlert.vue';
import { useAuthStep } from '../../composables/auth/useAuthStep';
import { useApi } from '../../composables/auth/useApi';
import { usePendingRequest } from '../../composables/auth/usePendingRequest';
import { messageFor, notices } from '../../composables/auth/useAuthMessages';

const step = useAuthStep();
const api = useApi();
const pending = usePendingRequest();

const message = ref('');
const status = ref('');
const codeMessage = ref('');
const displayPhone = ref('');
const typedPhone = ref('');
const remainingReRequests = ref(3);
const newPassword = ref('');
const passwordMessage = ref('');
const outcome = ref('');
const resending = ref(false);

const outcomeHeading = computed(() => {
  if (outcome.value === 'reset' || outcome.value === 'reset_blocked') {
    return 'تم تعيين كلمة المرور';
  }
  if (outcome.value === 'no_account') return 'لا يوجد حساب لهذا الرقم';
  if (outcome.value === 'administrator_account') return 'لا يمكن إعادة التعيين من هنا';
  return '';
});

const outcomeBody = computed(() => {
  if (outcome.value === 'reset') {
    return 'انتهت كل الجلسات السابقة. سجل الدخول بكلمة المرور الجديدة.';
  }
  if (outcome.value === 'reset_blocked') {
    return 'انتهت كل الجلسات السابقة. الحساب موقوف، ويبقى تسجيل الدخول مرفوضا حتى يعيد مسؤول الحساب تفعيله.';
  }
  if (outcome.value === 'no_account') {
    return 'لا يمكن إعادة تعيين كلمة مرور لرقم بلا حساب. أنشئ حسابا أو تحقق من الرقم.';
  }
  if (outcome.value === 'administrator_account') {
    return 'هذا الرقم لحساب إداري، ويدار الدخول إليه من واجهة الإدارة.';
  }
  return '';
});

function nationalOf(e164: string): string {
  return e164.startsWith('+218') ? e164.slice(4) : e164;
}

async function focusFirstField(): Promise<void> {
  await nextTick();
  document
    .querySelector<HTMLInputElement>('.bare-layout__card form input')
    ?.focus();
}

onMounted(async () => {
  try {
    await api.bootstrap();
  } catch {
    message.value = messageFor({ code: 'INTERNAL_ERROR' });
  }
  const resumed = await pending.resume();
  if (resumed.status === 'live' && resumed.data.purpose === 'recovery') {
    displayPhone.value = formatPhoneForDisplay(resumed.data.phone);
    typedPhone.value = nationalOf(resumed.data.phone);
    remainingReRequests.value = resumed.data.remainingReRequests;
    if (resumed.data.state === 'verified') {
      outcome.value = 'verified';
      await step.show('done');
    } else {
      await step.show('code');
    }
  }
});

function enterCodeStep(data: { phone: string; remainingReRequests: number }): void {
  displayPhone.value = formatPhoneForDisplay(data.phone);
  typedPhone.value = nationalOf(data.phone);
  remainingReRequests.value = data.remainingReRequests;
  void step.show('code');
}

async function onRequest(payload: { phone: string }): Promise<void> {
  message.value = '';
  step.clearAnnouncement();
  typedPhone.value = payload.phone;
  const result = await api.post<{
    requestId: string;
    phone: string;
    remainingReRequests?: number;
  }>('/api/v1/auth/password/forgot', payload);
  if (!result.ok) {
    message.value = messageFor({
      code: result.refusal.code,
      ...(result.refusal.reason === undefined ? {} : { reason: result.refusal.reason }),
    });
    return;
  }
  pending.remember(result.data.requestId);
  const resumed = await pending.resume(result.data.requestId);
  if (resumed.status !== 'live') return;
  enterCodeStep(resumed.data);
}

async function onVerify(code: string): Promise<void> {
  const requestId = pending.requestId.value;
  if (requestId === null) return;
  codeMessage.value = '';
  const result = await api.post<{ outcome: string }>(
    '/api/v1/auth/password/forgot/verify',
    { requestId, code },
  );
  if (!result.ok) {
    if (result.refusal.code === 'OTP_REQUEST_ENDED') {
      pending.forget();
      await step.end(messageFor({ code: 'OTP_REQUEST_ENDED' }));
      await focusFirstField();
      return;
    }
    if (result.refusal.code === 'OTP_EXPIRED') {
      const resumed = await pending.resume(requestId);
      if (resumed.status === 'expired') {
        await step.expire(messageFor({ code: 'OTP_EXPIRED' }));
        await focusFirstField();
        return;
      }
    }
    codeMessage.value = messageFor({ code: result.refusal.code });
    return;
  }
  if (result.data.outcome === 'verified') {
    outcome.value = 'verified';
    await step.show('done');
    return;
  }
  outcome.value = result.data.outcome;
  pending.forget();
  await step.show('done');
}

async function onResend(): Promise<void> {
  const requestId = pending.requestId.value;
  if (requestId === null) return;
  resending.value = true;
  const result = await api.post<{ remainingReRequests: number }>(
    '/api/v1/auth/verifications/resend',
    { requestId },
  );
  resending.value = false;
  if (!result.ok) {
    // A refusal that reports the request gone ends the code step exactly as the
    // verify path's does: back to the form with the recorded notice (FR-034).
    if (
      result.refusal.code === 'OTP_EXPIRED' ||
      result.refusal.code === 'OTP_REQUEST_ENDED'
    ) {
      pending.forget();
      await step.expire(messageFor({ code: result.refusal.code }));
      await focusFirstField();
      return;
    }
    codeMessage.value = messageFor({ code: result.refusal.code });
    return;
  }
  remainingReRequests.value = result.data.remainingReRequests;
  status.value = notices.resendAccepted;
}

async function onReset(): Promise<void> {
  const requestId = pending.requestId.value;
  if (requestId === null) return;
  passwordMessage.value = '';
  const result = await api.post<{ outcome: string }>('/api/v1/auth/password/reset', {
    requestId,
    newPassword: newPassword.value,
  });
  if (!result.ok) {
    // A refused submission never retains the plaintext: the field clears as
    // the message arrives (FR-038, FR-040; Constitution — Identity,
    // Authentication, and Session Policy).
    newPassword.value = '';
    if (result.refusal.code === 'RECOVERY_EXPIRED') {
      pending.forget();
      await step.expire(messageFor({ code: 'RECOVERY_EXPIRED' }));
      await focusFirstField();
      return;
    }
    passwordMessage.value = messageFor({ code: result.refusal.code });
    return;
  }
  newPassword.value = '';
  outcome.value = result.data.outcome;
  pending.forget();
  await step.show('done');
}

async function onChangeNumber(): Promise<void> {
  pending.forget();
  status.value = '';
  codeMessage.value = '';
  newPassword.value = '';
  step.clearAnnouncement();
  await step.show('form');
  await focusFirstField();
}
</script>

<template>
  <NuxtLayout
    name="bare"
    title="نسيت كلمة المرور"
    subtitle="سيصلك رمز على رقمك المسجل. لا نكشف وجود الحساب قبل التحقق من الرمز."
    :show-cross-links="outcome !== 'reset_blocked'"
  >
    <template #cross-links>
      <NuxtLink to="/auth/sign-in">تسجيل الدخول</NuxtLink>
    </template>

    <MessageAlert
      v-if="step.showsFirstStep.value"
      :message="step.announcement.value"
      :kind="step.announcementKind.value"
    />

    <RecoveryForm
      v-if="step.showsFirstStep.value"
      :loading="api.loading.value"
      :message="message"
      :initial-phone="typedPhone"
      @submit="onRequest"
    />

    <CodeStep
      v-if="step.step.value === 'code'"
      :collected="[]"
      :display-phone="displayPhone"
      :remaining-re-requests="remainingReRequests"
      :loading="api.loading.value"
      :resending="resending"
      :code-message="codeMessage"
      :status-message="status"
      :can-change-number="true"
      change-label="تغيير الرقم"
      @verify="onVerify"
      @resend="onResend"
      @change-number="onChangeNumber"
    />

    <NewPasswordStep
      v-if="step.step.value === 'done' && outcome === 'verified'"
      v-model="newPassword"
      :message="passwordMessage"
      :loading="api.loading.value"
      @submit="onReset"
    />

    <section
      v-if="step.step.value === 'done' && outcome !== 'verified'"
      class="wf-outcome"
      role="status"
    >
      <h2 :ref="step.heading" tabindex="-1" class="wf-outcome__heading">
        {{ outcomeHeading }}
      </h2>
      <p>{{ outcomeBody }}</p>
      <NuxtLink v-if="outcome === 'reset'" to="/auth/sign-in">
        الانتقال إلى تسجيل الدخول
      </NuxtLink>
      <NuxtLink v-else-if="outcome === 'no_account'" to="/auth/sign-up">
        إنشاء حساب
      </NuxtLink>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.wf-outcome {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-3);
}
.wf-outcome__heading {
  margin: 0;
  font-size: var(--wf-text-lg);
}
.wf-outcome a {
  min-block-size: var(--wf-touch-floor);
  display: inline-flex;
  align-items: center;
  color: var(--wf-primary);
}
</style>
