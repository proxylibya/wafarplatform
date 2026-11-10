// The Nitro plugin that gives every response a per-request nonce and the
// security headers the API also carries (FR-046, AC-050). The nonce reaches
// Nuxt's own entry scripts and the inline appearance bootstrap, so the policy
// needs no wildcard and no `'unsafe-inline'` for scripts.
import { randomBytes } from 'node:crypto';

function policyFor(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/** Adds the nonce to every script tag that does not already carry one. */
function withNonce(fragment: string, nonce: string): string {
  return fragment.replace(
    /<script(?![^>]*\bnonce=)(?=[\s>])/gi,
    `<script nonce="${nonce}"`,
  );
}

/**
 * Sets one header on both the Nitro response object and the Node response.
 * A rendered page is written by the Node response, so `event.res.headers`
 * alone reaches API/fetch answers but not the HTML a browser receives (T191).
 */
function setSecurityHeader(
  event: {
    res?: { headers?: Headers };
    node?: { res?: { setHeader: (name: string, value: string) => void; headersSent?: boolean } };
  },
  name: string,
  value: string,
): void {
  const headers = event.res?.headers;
  if (headers !== undefined) headers.set(name, value);
  const response = event.node?.res;
  if (response !== undefined && response.headersSent !== true) {
    response.setHeader(name, value);
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const nonce = randomBytes(16).toString('base64url');
    event.context['nonce'] = nonce;
  });

  // The rendered page is written by the Node response, so the headers are set
  // there just before it is sent; `event.res.headers` alone reaches API/fetch
  // answers but not the HTML a browser receives (FR-046, AC-050; T191).
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const nonce = event.context['nonce'];
    const policy =
      typeof nonce === 'string' ? policyFor(nonce) : "default-src 'self'";
    setSecurityHeader(event, 'Content-Security-Policy', policy);
    setSecurityHeader(event, 'X-Content-Type-Options', 'nosniff');
    setSecurityHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
    setSecurityHeader(
      event,
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    setSecurityHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin');
    if (process.env['NODE_ENV'] === 'production') {
      setSecurityHeader(
        event,
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
  });

  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context['nonce'];
    if (typeof nonce !== 'string') return;
    html.head = html.head.map((fragment) => withNonce(fragment, nonce));
    html.bodyPrepend = html.bodyPrepend.map((fragment) =>
      withNonce(fragment, nonce),
    );
    html.bodyAppend = html.bodyAppend.map((fragment) =>
      withNonce(fragment, nonce),
    );
  });
});
