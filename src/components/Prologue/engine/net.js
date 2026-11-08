/*
 * Fetch with retries. The prologue's files come over whatever link the visitor has (or a dev tunnel), and one
 * dropped request shouldn't cost them the whole scene. Network errors, a body cut off mid-download, 408, 429 and
 * 5xx are retried with backoff; any other 4xx (a missing file) fails at once. Every failed try is logged with the
 * file's name, so the console says what went wrong before the site falls back to the board.
 */
const DELAYS = [500, 1500, 3500];   // ms before the 2nd, 3rd and 4th tries

const describe = (e) => `${e?.name ?? 'Error'}: ${e?.message ?? e}`;

/** Fetch `url` and read its body as `as` ('arrayBuffer', 'json', 'text', 'blob'), retrying as above. */
export async function fetchWithRetry(url, as = 'arrayBuffer', { label = url, delays = DELAYS } = {}) {
  const tries = delays.length + 1;
  let last;
  for (let i = 0; i < tries; i++) {
    if (i) await new Promise((r) => setTimeout(r, delays[i - 1]));
    try {
      // A retry skips the HTTP cache, in case a truncated response got stored.
      const res = await fetch(url, i ? { cache: 'reload' } : undefined);
      if (!res.ok) {
        const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
        const err = new Error(`HTTP ${res.status} ${res.statusText}`.trim());
        if (!retryable) throw Object.assign(err, { fatal: true });
        throw err;
      }
      return await res[as]();   // the body can drop mid-download too, so reading it is inside the retry
    } catch (e) {
      last = e;
      console.warn(`[prologue] ${label}: try ${i + 1}/${tries} failed (${describe(e)})`);
      if (e?.fatal) break;
    }
  }
  throw new Error(`${label} failed to load (${describe(last)})`, { cause: last });
}
