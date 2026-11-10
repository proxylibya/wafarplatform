// The OpenAPI 3.1 generator: the document is emitted from the Zod contract
// schemas and this route table, so the implementation and the published
// interface have one source (ADR-002; T125).
import { z } from 'zod';
import {
  changePasswordRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  resendRequestSchema,
  signInRequestSchema,
  signUpRequestSchema,
  verifyCodeRequestSchema,
} from '@wafar/shared';

const json = (schema: z.ZodType): Record<string, unknown> => {
  const converted = z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>;
  delete converted['$schema'];
  return converted;
};

const errorResponse = {
  description: 'The error envelope of contracts/auth-api.md §3',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'retryable'],
            properties: {
              code: { type: 'string' },
              retryable: { type: 'boolean' },
              field: { type: 'string' },
              reason: { type: 'string', enum: ['empty', 'too_long', 'emoji'] },
              retryAfterSeconds: { type: 'integer', minimum: 0 },
            },
          },
        },
      },
    },
  },
};

function route(
  method: 'get' | 'post',
  summary: string,
  options: {
    body?: z.ZodType;
    okStatus: string;
    okDescription: string;
    tags: string[];
  },
): Record<string, unknown> {
  const operation: Record<string, unknown> = {
    summary,
    tags: options.tags,
    responses: {
      [options.okStatus]: { description: options.okDescription },
      default: errorResponse,
    },
  };
  if (options.body !== undefined) {
    operation['requestBody'] = {
      required: true,
      content: { 'application/json': { schema: json(options.body) } },
    };
  }
  return { [method]: operation };
}

/** The committed document's full path table. */
export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Wafar Identity and Foundation API',
      version: '1.0.0',
      description:
        'The public authentication surface of R1. Generated from packages/shared/src/contracts and the route table.',
    },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/auth/csrf': route('get', 'The render bootstrap', {
        okStatus: '200',
        okDescription: 'A CSRF token and a signed form stamp',
        tags: ['transport'],
      }),
      '/auth/sign-up': route('post', 'Start an account-creation request', {
        body: signUpRequestSchema,
        okStatus: '202',
        okDescription: 'The pending request and the resume cookie',
        tags: ['sign-up'],
      }),
      '/auth/sign-up/verify': route('post', 'Consume the code and create the account', {
        body: verifyCodeRequestSchema,
        okStatus: '200',
        okDescription: 'One of the four outcomes',
        tags: ['sign-up'],
      }),
      '/auth/verifications/{requestId}': route('get', 'The resume read', {
        okStatus: '200',
        okDescription: 'The pending request the cookie names',
        tags: ['sign-up', 'recovery'],
      }),
      '/auth/verifications/resend': route('post', 'Request a new code', {
        body: resendRequestSchema,
        okStatus: '202',
        okDescription: 'The restarted expiries and the remaining allowance',
        tags: ['sign-up', 'recovery'],
      }),
      '/auth/sign-in': route('post', 'Sign in', {
        body: signInRequestSchema,
        okStatus: '200',
        okDescription: 'A session cookie',
        tags: ['session'],
      }),
      '/auth/sign-out': route('post', 'End the current session', {
        okStatus: '204',
        okDescription: 'Ended, or nothing to end',
        tags: ['session'],
      }),
      '/auth/sign-out-all': route('post', 'End every session of the account', {
        okStatus: '204',
        okDescription: 'Every live session revoked',
        tags: ['session'],
      }),
      '/auth/session': route('get', 'Read the session', {
        okStatus: '200',
        okDescription: 'The guest state or the signed-in session',
        tags: ['session'],
      }),
      '/auth/password/forgot': route('post', 'Start a recovery request', {
        body: forgotPasswordRequestSchema,
        okStatus: '202',
        okDescription: 'The pending request and the resume cookie',
        tags: ['recovery'],
      }),
      '/auth/password/forgot/verify': route('post', 'Verify the recovery code', {
        body: verifyCodeRequestSchema,
        okStatus: '200',
        okDescription: 'The verified, no-account, or administrator outcome',
        tags: ['recovery'],
      }),
      '/auth/password/reset': route('post', 'Set the new password', {
        body: resetPasswordRequestSchema,
        okStatus: '200',
        okDescription: 'The reset outcome',
        tags: ['recovery'],
      }),
      '/auth/password/change': route('post', 'The account’s own change action', {
        body: changePasswordRequestSchema,
        okStatus: '200',
        okDescription: 'The change completed and every session ended',
        tags: ['session'],
      }),
    },
    components: {
      securitySchemes: {
        sessionCookie: { type: 'apiKey', in: 'cookie', name: 'wafar.session' },
      },
    },
  };
}
