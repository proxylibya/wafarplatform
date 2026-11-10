// The page response's security headers: the six of contracts/auth-api.md §2.4,
// set by the Nitro render hook, with a per-response nonce and a script source
// that carries no wildcard, no `'unsafe-inline'`, no eval-permitting source, and
// no `'strict-dynamic'` (FR-046, AC-050; T178).
import { expect, test } from '@playwright/test';

const pages = ['/auth/sign-up', '/auth/sign-in', '/auth/forgot-password'] as const;

for (const path of pages) {
  test(`${path} carries the contract's security headers`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');

    const policy = headers['content-security-policy'] ?? '';
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("form-action 'self'");

    const scriptSource = policy
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('script-src'));
    expect(scriptSource, 'the policy carries a script-src').toBeDefined();
    expect(scriptSource).toMatch(/'nonce-[^']+'/);
    expect(scriptSource).not.toContain('*');
    expect(scriptSource).not.toContain("'unsafe-inline'");
    expect(scriptSource).not.toContain("'unsafe-eval'");
    expect(scriptSource).not.toContain("'strict-dynamic'");

    // The class's fixed environment is the production build, so the transport
    // declaration is always present (T191, T200).
    expect(headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });
}
