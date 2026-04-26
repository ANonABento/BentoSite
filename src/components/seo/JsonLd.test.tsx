import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsonLd } from './JsonLd';

describe('JsonLd', () => {
  it('renders escaped JSON-LD script content', () => {
    const { container } = render(
      <JsonLd id="test-json-ld" data={{ name: '<script>alert("x")</script>' }} />
    );

    const script = container.querySelector('#test-json-ld');

    expect(script).not.toBeNull();
    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(script?.innerHTML).toContain('\\u003cscript>');
    expect(script?.innerHTML).not.toContain('<script>alert');
  });
});
