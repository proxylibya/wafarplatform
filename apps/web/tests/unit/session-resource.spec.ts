// The session resource under its provider: the passive read carries no
// activity signal, and the merchant-initiated read carries the CSRF pair the
// bootstrap held, both mounted the way a page calls the composable
// (FR-032, AC-015; T072, T216, T263).
import { mount } from '@vue/test-utils';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, unref } from 'vue';
import { heldCsrfToken, useApi } from '../../app/composables/auth/useApi';
import { useSession, type SessionPayload } from '../../app/composables/auth/useSession';

type SessionComposable = ReturnType<typeof useSession>;

interface FetchCall {
  input: string;
  init: RequestInit;
}

const calls: FetchCall[] = [];

const sessionPayload: SessionPayload = {
  authenticated: true,
  user: { fullName: 'أمين الحديد' },
  session: {
    expiresAt: '2026-11-10T18:00:00.000Z',
    lastActivityAt: '2026-11-10T10:00:00.000Z',
    restricted: false,
  },
};

function headersOf(call: FetchCall | undefined): Record<string, string> {
  return (call?.init.headers ?? {}) as Record<string, string>;
}

function stubFetch(
  answerFor: (input: string) => { status: number; body: unknown },
): void {
  vi.stubGlobal(
    'fetch',
    async (input: string | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      calls.push({ input: url, init: init ?? {} });
      const { status, body } = answerFor(url);
      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
      } as unknown as Response;
    },
  );
}

/** Mounts one component whose setup calls the composable, the way a page does. */
function mountSession(): SessionComposable {
  let exposed!: SessionComposable;
  mount(
    defineComponent({
      setup() {
        exposed = useSession();
        return () => h('div');
      },
    }),
    {
      global: {
        plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      },
    },
  );
  return exposed;
}

afterEach(() => {
  vi.unstubAllGlobals();
  calls.length = 0;
});

describe('the session resource', () => {
  it('needs its provider: the composable throws without it', () => {
    expect(() => useSession()).toThrow();
  });

  it('sends no activity signal on the passive read and the pair on the merchant one', async () => {
    const { bootstrap } = useApi();
    stubFetch((url) =>
      url.endsWith('/api/v1/auth/csrf')
        ? { status: 200, body: { csrfToken: 'held-token', formStamp: 'held-stamp' } }
        : { status: 200, body: sessionPayload },
    );

    await bootstrap();
    expect(heldCsrfToken()).toBe('held-token');

    const session = mountSession();
    await vi.waitFor(() => {
      expect(unref(session.data)).toEqual(sessionPayload);
    });
    const read = calls.find((call) => call.input.endsWith('/api/v1/auth/session'));
    expect(read?.init.credentials).toBe('same-origin');
    expect(headersOf(read)).toEqual({ accept: 'application/json' });

    const refreshed = await session.refreshFromUserAction();
    expect(refreshed).toEqual(sessionPayload);
    const written = calls.at(-1);
    expect(written?.input).toBe('/api/v1/auth/session');
    expect(written?.init.credentials).toBe('same-origin');
    expect(headersOf(written)).toEqual({
      accept: 'application/json',
      'x-wafar-activity': '1',
      'x-wafar-csrf': 'held-token',
    });

    for (const passive of calls.filter((c) => c.input.endsWith('/session')).slice(0, -1)) {
      expect(Object.keys(headersOf(passive))).not.toContain('x-wafar-activity');
    }
  });
});
