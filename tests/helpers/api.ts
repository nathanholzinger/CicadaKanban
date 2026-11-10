import { apiUrl, currentSlot } from './slots';

// The E2E API base URL, spelled once for every spec and helper: the server of
// the worker's own slot (`slots.ts`). Fixed when the worker loads the module,
// which is after Playwright has set the worker's `TEST_PARALLEL_INDEX`.
export const API = apiUrl(currentSlot());
