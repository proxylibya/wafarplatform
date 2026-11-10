// The operator CLI as the tests run it: a real child process against the same
// database, so the hidden channel, the refusals, and the exit codes are the
// ones an operator meets rather than an in-process approximation.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));

export interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export interface ProvisionInput {
  phone: string;
  fullName: string;
  city: string;
  /** The credential, given on the channel the caller chooses. */
  password?: string;
  /** Extra argv beyond the field flags. */
  args?: string[];
  /** Environment overrides; `undefined` removes the key. */
  env?: Record<string, string | undefined>;
}

/** Runs `provision-administrator` with the credential on standard input. */
export function provision(input: ProvisionInput): CliResult {
  const args = [
    'node_modules/tsx/dist/cli.mjs',
    'src/cli/provision-administrator.ts',
    '--phone',
    input.phone,
    '--full-name',
    input.fullName,
    '--city',
    input.city,
    ...(input.args ?? []),
  ];
  if (input.password !== undefined) args.push('--password-stdin');
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const [key, value] of Object.entries(input.env ?? {})) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  const result = spawnSync(process.execPath, args, {
    cwd: apiRoot,
    env,
    input: input.password ?? '',
    encoding: 'utf8',
    timeout: 60_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

/** The one `auth.administrator.provisioned` record a successful run writes. */
export function provisionedRecords(stdout: string): Array<Record<string, unknown>> {
  return stdout
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('{'))
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((record) => record['event'] === 'auth.administrator.provisioned');
}
