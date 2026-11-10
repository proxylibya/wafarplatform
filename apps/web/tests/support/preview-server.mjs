// The Lighthouse class's server entry: the built Nitro artifact on the fixed
// loopback host and port, started without a shell-specific environment prefix
// (plan.md -> The test classes' environments; T237).
process.env['NODE_ENV'] = 'production';
process.env['HOST'] = '127.0.0.1';
process.env['PORT'] = '3000';

await import('../../.output/server/index.mjs');
