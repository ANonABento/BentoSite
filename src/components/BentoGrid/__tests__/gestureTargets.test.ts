import { afterEach, describe, expect, it } from 'vitest';
import { startsOnInteractiveControl } from '../core/gestureTargets';

/**
 * The category filters on /projects and /playground were dead: the panel
 * swallowed `pointerdown` for its own drag behaviour, and useGesture then
 * suppressed the click that would have run the chip's handler. This predicate
 * is what keeps controls exempt, so both of its answers need pinning down.
 */

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
}

describe('startsOnInteractiveControl', () => {
  it('is true for a press on a button', () => {
    const button = mount('<button>Hackathon</button>');
    expect(startsOnInteractiveControl(button)).toBe(true);
  });

  it('is true for a press on something inside a button', () => {
    const wrapper = mount('<button><span>Reset</span></button>');
    const span = wrapper.querySelector('span')!;
    expect(startsOnInteractiveControl(span)).toBe(true);
  });

  it.each(['a', 'input', 'textarea', 'select'])('is true for %s', (tag) => {
    const el = mount(`<${tag}></${tag}>`);
    expect(startsOnInteractiveControl(el)).toBe(true);
  });

  it('is true for an element with role=button', () => {
    const el = mount('<div role="button">Open</div>');
    expect(startsOnInteractiveControl(el)).toBe(true);
  });

  it('is false for the panel surface itself', () => {
    const el = mount('<div class="panel">chrome</div>');
    expect(startsOnInteractiveControl(el)).toBe(false);
  });

  it('is false for a null or non-element target', () => {
    expect(startsOnInteractiveControl(null)).toBe(false);
    expect(startsOnInteractiveControl(document)).toBe(false);
    expect(startsOnInteractiveControl(new EventTarget())).toBe(false);
  });
});
