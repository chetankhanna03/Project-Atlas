import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { SourcesView } from './SourcesView';
import * as api from '../../services/atlas';

vi.mock('../../services/atlas', async original => ({
  ...(await original<typeof import('../../services/atlas')>()),
  getSources: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

it('shows backend configuration without claiming a source is online', async () => {
  vi.mocked(api.getSources).mockResolvedValue({ note: 'Configuration only; not a live health check.', sources: [
    { id: 'gfw', name: 'Global Fishing Watch', domain: 'fisheries', access: 'credentialed',
      status: 'needs_credentials', required_settings: ['GFW_API_KEY'], limitations: 'Apparent effort, not catch.',
      source_url: 'https://gateway.api.globalfishingwatch.org/' },
  ] });
  render(<SourcesView setActiveTab={vi.fn()} onSyncClick={vi.fn()} />);
  expect(await screen.findByText('Credentials needed')).toBeTruthy();
  expect(screen.getByText(/GFW_API_KEY/)).toBeTruthy();
  expect(screen.queryByText('ONLINE')).toBeNull();
  expect(screen.getByRole('link', { name: 'Provider website' }).getAttribute('href')).toBe('https://gateway.api.globalfishingwatch.org/');
});

it('reports backend errors instead of showing simulated sources', async () => {
  vi.mocked(api.getSources).mockRejectedValue(new Error('Backend unavailable'));
  render(<SourcesView setActiveTab={vi.fn()} onSyncClick={vi.fn()} />);
  expect((await screen.findByRole('alert')).textContent).toContain('Backend unavailable');
  expect(screen.queryByText('ONLINE')).toBeNull();
});
