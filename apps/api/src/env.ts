// The validated environment: every key the quickstart names is read once at
// boot, so a bad value stops startup instead of failing a request.
import { z } from 'zod';
import { smsFakeMaxAcceptMs } from '@wafar/shared';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(16).default('development-only-secret-value-0000'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  // The contract's trusted-proxy list (§2.5): comma-separated addresses whose
  // X-Real-IP is honoured. Unset means no header is trusted.
  TRUSTED_PROXIES: z.string().default(''),
  SMS_TRANSPORT: z.enum(['fake', 'twilio']).default('fake'),
  SMS_FAKE_ACCEPT_MS: z.coerce.number().int().min(0).max(smsFakeMaxAcceptMs).default(0),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  BACKUP_KEY_ENCRYPTION_KEY: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/** Reads the comma-separated trusted-proxy list; an empty value trusts none. */
export function trustedProxiesFrom(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

let cached: Env | undefined;

/** Reads and validates the environment once; a second call reuses the result. */
export function environment(): Env {
  if (cached === undefined) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
      process.exit(1);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Test-only: drops the cache so a suite can set a key and read it again. */
export function resetEnvironmentCache(): void {
  cached = undefined;
}
