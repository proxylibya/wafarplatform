// The fixed refusal order of FR-051. The steps are data, so a route composes
// them in one order and a test can assert which step decided a request.
export const refusalOrder = [
  'csrf',
  'operation_limit',
  'honeypot',
  'minimum_time',
  'value_rules',
  'account_comparison',
] as const;

export type RefusalStep = (typeof refusalOrder)[number];

/** The steps that apply to the sign-up form, in order. */
export const signUpSteps: readonly RefusalStep[] = refusalOrder;

/** Sign-in has no honeypot, no minimum time, and no form stamp. */
export const signInSteps: readonly RefusalStep[] = [
  'csrf',
  'operation_limit',
  'value_rules',
  'account_comparison',
];

/** Recovery has no honeypot and no minimum time. */
export const recoverySteps: readonly RefusalStep[] = [
  'csrf',
  'operation_limit',
  'value_rules',
];

/** True when the earlier step decides before the later one is reached. */
export function decidesBefore(earlier: RefusalStep, later: RefusalStep): boolean {
  return refusalOrder.indexOf(earlier) < refusalOrder.indexOf(later);
}
