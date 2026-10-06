// The coarsest-decimal-that-fits search for position values (wiki positioning §3),
// kept apart from positionResolver.ts so it can be unit-tested standalone.

const DEFAULT_MAX_COARSEST_FIT_DECIMALS = 12;

/**
 * Returns the 'coarsest' (least precise) midpoint between two numbers
 * Since dividing in half increases decimal specificity every step we devised a strategy that increases more slowly
 * Consider starting with 1 and 2 and dividing between the new midpoint and 2 each time
 * Instead of: 1.5 -> 1.75 -> 1.875 -> 1.9375 -> 1.96875 -> 1.984375 -> 1.9921875
 * We get coarser fits of: 1.5 -> 1.8 -> 1.9 -> 1.95 -> 1.98 -> 1.99 -> 1.995
 *
 * @param prev
 * @param next
 * @param maxDecimals - optionally provide a max number of decimal specifity
 *          DEFAULT_MAX_COARSEST_FIT_DECIMALS is used when no value is provided
 * @returns the coarsest number between prev and next
 *          or null if the coarsest fit is more precise than maxDecimals allows
 *
 * @example prev=1.5, next=2.0 (exact midpoint = 1.75)
 *  -> tries round(1.75, 0) = 2 -> not between 1.5 an 2 (exclusive) so it goes less coarse
 *  -> returns round(1.75, 1) = 1.8 -> 1.8 is inbetween so it is returned
 * @example prev=1.9, next=3.02 (exact midpoint = 2.46)
 *  -> returns round(2.46, 0) = 2
 * @example prev=101.1, next=101.2 (exact midpoint = 101.15)
 *  -> tries round(101.15, 0) = 101
 *  -> tries round(101.15, 1) = 101.2
 *  -> returns round(101.15, 2) = 101.15
 */
export function coarsestFit(
  prev: number,
  next: number,
  maxDecimals: number = DEFAULT_MAX_COARSEST_FIT_DECIMALS,
): number | null {
  const midpoint = (prev + next) / 2;
  for (let decimals = 0; decimals <= maxDecimals; decimals++) {
    const candidate = roundToDecimals(midpoint, decimals);
    if (candidate > prev && candidate < next) return candidate;
  }
  return null;
}

function roundToDecimals(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
