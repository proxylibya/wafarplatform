// The enumeration sampling SC-004 fixes: a warm-up, a sample count read from
// one place, and the trimmed median and p95 the comparison is stated in, so the
// three enumeration suites share one measurement and one tolerance (T163).

/** The fixed sample count; `ENUMERATION_SAMPLES` only shortens a local run. */
export function enumerationSamples(): number {
  const raw = process.env['ENUMERATION_SAMPLES'];
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 200;
}

/** How many requests each case runs before sampling begins. */
export const enumerationWarmUp = 20;

/** Drops the top and bottom 5% of a sample set. */
export function trim(samples: readonly number[]): number[] {
  const sorted = [...samples].sort((a, b) => a - b);
  const drop = Math.floor(sorted.length * 0.05);
  return sorted.slice(drop, sorted.length - drop);
}

export function median(samples: readonly number[]): number {
  const values = trim(samples);
  if (values.length === 0) return Number.NaN;
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[middle] as number;
  return ((values[middle - 1] as number) + (values[middle] as number)) / 2;
}

export function percentile(samples: readonly number[], fraction: number): number {
  const values = trim(samples);
  if (values.length === 0) return Number.NaN;
  const index = Math.min(values.length - 1, Math.ceil(fraction * values.length) - 1);
  return values[Math.max(0, index)] as number;
}

/** The accepted tolerances of plan record 14: median ≤ 50 ms, p95 ≤ 150 ms. */
export const enumerationTolerance = { medianMs: 50, p95Ms: 150 } as const;

/** True when the shorter case is not meaningfully faster than the longer one. */
export function withinTolerance(
  shorter: readonly number[],
  longer: readonly number[],
): { ok: boolean; medianDifference: number; p95Difference: number } {
  const medianDifference = median(longer) - median(shorter);
  const p95Difference = percentile(longer, 0.95) - percentile(shorter, 0.95);
  return {
    ok:
      medianDifference <= enumerationTolerance.medianMs &&
      p95Difference <= enumerationTolerance.p95Ms,
    medianDifference,
    p95Difference,
  };
}
