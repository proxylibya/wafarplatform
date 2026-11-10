// The session resource: TanStack Query owns it, and `X-Wafar-Activity: 1` is
// sent only from a merchant-initiated handler, together with the CSRF pair so
// the signal is honoured (FR-032, AC-015, contracts/auth-api.md §2.3).
import { useQuery } from '@tanstack/vue-query';
import { heldCsrfToken } from './useApi';

export interface SessionPayload {
  authenticated: boolean;
  user?: { fullName: string };
  session?: { expiresAt: string; lastActivityAt: string; restricted: boolean };
}

export function useSession() {
  const query = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<SessionPayload> => {
      const response = await fetch('/api/v1/auth/session', {
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
      });
      if (response.status === 401) return { authenticated: false };
      return (await response.json()) as SessionPayload;
    },
    staleTime: 30_000,
  });

  /** A merchant-initiated read: the only path that resets the inactivity clock. */
  async function refreshFromUserAction(): Promise<SessionPayload> {
    const token = heldCsrfToken();
    const response = await fetch('/api/v1/auth/session', {
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        'x-wafar-activity': '1',
        ...(token === null ? {} : { 'x-wafar-csrf': token }),
      },
    });
    if (response.status === 401) return { authenticated: false };
    return (await response.json()) as SessionPayload;
  }

  return { ...query, refreshFromUserAction };
}
