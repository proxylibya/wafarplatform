// The browser's tie to its pending request: the identifier alone is kept, never
// a number, a name, or a code. The pending cookie is the authority, and the
// resume read decides the step (FR-038, FR-041, contracts/ui-contracts.md §3.1).
import { ref } from 'vue';

const KEY = 'wafar.pending.requestId';

function read(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(KEY);
}

/** The request the page is still tied to, for the submission's tie header. */
export function heldPendingRequestId(): string | null {
  return read();
}

export interface ResumePayload {
  requestId: string;
  purpose: 'sign_up' | 'recovery';
  state: 'pending' | 'verified';
  phone: string;
  codeExpiresAt: string;
  expiresAt: string;
  remainingReRequests: number;
  payload?: { fullName: string; city: string; shopName?: string };
}

export type ResumeResult =
  | { status: 'live'; data: ResumePayload }
  | { status: 'expired' }
  | { status: 'none' };

export function usePendingRequest() {
  const requestId = ref<string | null>(read());

  function remember(id: string): void {
    requestId.value = id;
    try {
      sessionStorage.setItem(KEY, id);
    } catch {
      // A blocked store leaves the tie in memory only.
    }
  }

  function forget(): void {
    requestId.value = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // Nothing to clear.
    }
  }

  /** Reads the pending request back; 200 is the only way into the code step. */
  async function resume(id = requestId.value): Promise<ResumeResult> {
    if (id === null) return { status: 'none' };
    const response = await fetch(`/api/v1/auth/verifications/${encodeURIComponent(id)}`, {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (response.status === 200) {
      const data = (await response.json()) as ResumePayload;
      remember(data.requestId);
      return { status: 'live', data };
    }
    forget();
    return { status: 'expired' };
  }

  return { requestId, remember, forget, resume };
}
