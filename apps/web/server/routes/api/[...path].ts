// The page's same-origin API path in the production build: forwards `/api/**`
// to the API service, replacing the dev server's `devProxy` so the build the
// Playwright classes serve exercises the same requests (FR-046, AC-050; T200).
export default defineEventHandler((event) => {
  const origin = process.env['API_BASE'] ?? 'http://localhost:3001';
  // `event.path` already carries the query string, so the target keeps it.
  const target = new URL(event.path, origin);
  return proxyRequest(event, target.toString());
});
