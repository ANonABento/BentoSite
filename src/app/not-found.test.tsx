import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from './not-found';

describe('NotFound', () => {
  it('renders branded 404 copy with home and projects links', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', {
      name: 'This page drifted out of the viewport.',
    })).toBeInTheDocument();
    expect(screen.getByText('Route not found')).toBeInTheDocument();
    expect(screen.getByText('No matching page found')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /View projects/i })).toHaveAttribute(
      'href',
      '/projects'
    );
  });
});
