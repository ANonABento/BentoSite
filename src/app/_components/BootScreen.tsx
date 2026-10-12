'use client';

/**
 * BootScreen — the bentOS terminal, shown while the board loads. It stays up
 * long enough for the CRT to switch on the first time in a session; after
 * that it only covers the actual load. Clicking skips it.
 */

import { useEffect, useState } from 'react';

const FIRST_BOOT_MS = 1100;
const FADE_MS = 350;
const SEEN_KEY = 'bentos-booted';

interface BootScreenProps {
  /** Terminal lines: a command and its output. */
  lines: [string, string][];
  /** The board has mounted. */
  ready: boolean;
}

export function BootScreen({ lines, ready }: BootScreenProps) {
  const [shownLongEnough, setShownLongEnough] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Storage blocked: boot every time.
    }
    const timer = window.setTimeout(() => setShownLongEnough(true), seen ? 0 : FIRST_BOOT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const leaving = ready && shownLongEnough;
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setGone(true), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  if (gone) return null;

  return (
    <div
      aria-hidden={leaving}
      role="status"
      onClick={() => setShownLongEnough(true)}
      className="crt crt-on fixed inset-0 z-50 grid place-items-center px-4 transition-opacity"
      style={{ opacity: leaving ? 0 : 1, transitionDuration: `${FADE_MS}ms`, pointerEvents: leaving ? 'none' : 'auto' }}
    >
      <div className="w-full max-w-[560px]">
        <div className="flex justify-between text-lg text-phosphor/55">
          <span>bentOS</span>
          <span className="text-purple">crt mode</span>
        </div>
        <div className="wordmark my-10 text-[clamp(3.5rem,14vw,6.5rem)]">bentOS</div>
        <div className="space-y-1 text-xl leading-tight">
          {lines.map(([cmd, out]) => (
            <div key={cmd}>
              <div>
                <span className="text-orange">&gt;</span> {cmd}
              </div>
              <div className="truncate text-phosphor/65">{out}</div>
            </div>
          ))}
          <div>
            <span className="text-orange">&gt;</span> {ready ? '' : 'loading projects '}
            <span className="cursor" />
          </div>
        </div>
      </div>
    </div>
  );
}
