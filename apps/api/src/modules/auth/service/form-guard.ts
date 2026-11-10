// The form guard: the honeypot's silent success and the minimum time-to-submit
// from the signed stamp, read on the server's clock (FR-029, AC-031, AC-032).
import { verifyFormStamp } from '../../../http/security.ts';

export type FormGuardResult =
  | { kind: 'ok' }
  | { kind: 'silent' }
  | { kind: 'too_fast'; reason: string };

export function inspectForm(input: {
  website: string | undefined;
  formStamp: string;
  secret: string;
  now: Date;
}): FormGuardResult {
  // Step 2: a filled honeypot receives the silent success, whatever the stamp.
  if (input.website !== undefined && input.website !== '') {
    return { kind: 'silent' };
  }
  // Step 3: the stamp's own issuance time, never a value the request supplies.
  const stamp = verifyFormStamp(input.secret, input.formStamp, input.now);
  if (!stamp.ok) return { kind: 'too_fast', reason: stamp.reason };
  return { kind: 'ok' };
}
