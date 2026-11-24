import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Activities from '../src/components/Activities.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('shows the recorded date for activities that include one', async () => {
  const occurredAt = '2026-01-10T12:00:00.000Z';
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    activities: [{ type: 'run', minutes: 30, points: 30, occurredAt }],
  }), { status: 200 })));

  render(<Activities />);
  const date = await screen.findByText(/2026/);

  expect(date.tagName).toBe('TIME');
  expect(date).toHaveAttribute('dateTime', occurredAt);
});
