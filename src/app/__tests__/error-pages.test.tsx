import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RouteError from '../error';
import GlobalError from '../global-error';

/**
 * `/projects`, `/photography`, and `/playground` run Matter.js and a WebGL
 * canvas with no boundary of their own, so before these files existed a throw
 * in any of them left the visitor on Next's bare "Application error" text with
 * no route back into the site.
 */

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('RouteError', () => {
  it('offers a retry that re-renders the segment, and a way out of it', () => {
    const reset = vi.fn();
    render(<RouteError error={new Error('canvas exploded')} reset={reset} />);

    screen.getByRole('button', { name: /try again/i }).click();

    expect(reset).toHaveBeenCalledTimes(1);
    // The escape hatch matters as much as the retry: a route that fails
    // deterministically would otherwise trap the visitor.
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });

  it('shows the digest, which is the only handle on a production stack trace', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });
    render(<RouteError error={error} reset={vi.fn()} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('omits the ref line when there is no digest', () => {
    render(<RouteError error={new Error('boom')} reset={vi.fn()} />);

    expect(screen.queryByText(/^ref:/)).not.toBeInTheDocument();
  });

  it('logs the error, since production strips the message from the props', () => {
    const error = new Error('canvas exploded');
    render(<RouteError error={error} reset={vi.fn()} />);

    expect(console.error).toHaveBeenCalledWith('Route error:', error);
  });
});

describe('GlobalError', () => {
  // Rendered to static markup rather than into jsdom: it emits its own <html>
  // and <body>, which cannot be nested inside a container div.
  it('renders a self-contained document, because the app CSS is gone', () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error('layout died')} reset={vi.fn()} />,
    );

    expect(markup).toContain('<html');
    expect(markup).toContain('<body');
    expect(markup).toContain('bentOS failed to start');
    // Inline styles only — a class name here would style nothing.
    expect(markup).toContain('style=');
    expect(markup).not.toContain('class=');
  });
});
