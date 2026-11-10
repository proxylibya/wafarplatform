// The shared step state machine and the in-progress guard: one step shown at a
// time, a submission never replaced while in flight, focus moved to the step now
// shown, and the two endings that return the flow to its first step (FR-040,
// FR-034, AC-041, AC-043, AC-036).
import { computed, nextTick, ref } from 'vue';

export type AuthStep =
  | 'form'
  | 'submitting'
  | 'code'
  | 'done'
  | 'expired_notice'
  | 'ended_notice';

export interface AuthStepOptions {
  onStepShown?: (step: AuthStep) => void;
}

export function useAuthStep(options: AuthStepOptions = {}) {
  const step = ref<AuthStep>('form');
  const announcement = ref('');
  const announcementKind = ref<'status' | 'alert'>('status');
  const heading = ref<HTMLElement | null>(null);

  const inProgress = computed(() => step.value === 'submitting');
  const showsFirstStep = computed(
    () => step.value === 'form' || step.value === 'expired_notice' || step.value === 'ended_notice',
  );

  async function show(next: AuthStep): Promise<void> {
    step.value = next;
    await nextTick();
    options.onStepShown?.(next);
    heading.value?.focus?.();
  }

  function announce(text: string, kind: 'status' | 'alert' = 'status'): void {
    announcement.value = text;
    announcementKind.value = kind;
  }

  function clearAnnouncement(): void {
    announcement.value = '';
  }

  /** The pending request's lifetime ended while the code step was shown. */
  async function expire(text: string): Promise<void> {
    announce(text, 'status');
    await show('expired_notice');
  }

  /** The fifth incorrect entry ended the request at its bound. */
  async function end(text: string): Promise<void> {
    announce(text, 'status');
    await show('ended_notice');
  }

  return {
    step,
    announcement,
    announcementKind,
    heading,
    inProgress,
    showsFirstStep,
    show,
    announce,
    clearAnnouncement,
    expire,
    end,
  };
}
