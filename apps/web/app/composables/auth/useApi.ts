// The one client for the API: it holds the CSRF token and the form stamp the
// render bootstrap returned, sends the pair on every mutation, presents the
// page's pending tie while one stands, and refreshes the pair after a
// FORM_TOO_FAST so the retry needs no reload (FR-044, FR-029, FR-038).
import { ref } from 'vue';
import type { AuthErrorCode } from '@wafar/shared';
import { heldPendingRequestId } from './usePendingRequest';

export interface BootstrapPair {
  csrfToken: string;
  formStamp: string;
}

export interface ApiRefusal {
  code: AuthErrorCode;
  reason?: 'empty' | 'too_long' | 'emoji';
  field?: string;
  retryAfterSeconds?: number;
}

let pair: BootstrapPair | null = null;

/** The CSRF token the render bootstrap returned, for a same-origin proof. */
export function heldCsrfToken(): string | null {
  return pair?.csrfToken ?? null;
}

export function useApi() {
  const loading = ref(false);

  async function bootstrap(): Promise<BootstrapPair> {
    const response = await fetch('/api/v1/auth/csrf', {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error('bootstrap failed');
    pair = (await response.json()) as BootstrapPair;
    return pair;
  }

  async function stamp(): Promise<string> {
    if (pair === null) await bootstrap();
    return pair?.formStamp ?? '';
  }

  async function post<T>(
    path: string,
    body: unknown,
  ): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; refusal: ApiRefusal }> {
    if (pair === null) await bootstrap();
    loading.value = true;
    const tie = heldPendingRequestId();
    try {
      const response = await fetch(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'x-wafar-csrf': pair?.csrfToken ?? '',
          ...(tie === null ? {} : { 'x-wafar-pending': tie }),
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as T;
        return { ok: true, status: response.status, data };
      }
      const payload = (await response.json().catch(() => ({}))) as {
        error?: ApiRefusal;
      };
      const refusal = payload.error ?? { code: 'INTERNAL_ERROR' };
      if (refusal.code === 'FORM_TOO_FAST') await bootstrap();
      return { ok: false, status: response.status, refusal };
    } catch {
      return { ok: false, status: 0, refusal: { code: 'INTERNAL_ERROR' } };
    } finally {
      loading.value = false;
    }
  }

  return { loading, bootstrap, stamp, post };
}
