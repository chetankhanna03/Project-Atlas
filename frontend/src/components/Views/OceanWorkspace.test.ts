import { afterEach, expect, it, vi } from 'vitest';
import { loadLayer } from './OceanWorkspace';
const query = { west: 50, south: 5, east: 78, north: 25, start: '2026-09-01', end: '2026-09-20', parameter: 'temperature', species: 'Thunnus', layers: [] };
afterEach(() => vi.unstubAllGlobals());
it('shows provider failures without inventing data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 503, json: async () => ({detail: 'Provider unavailable'})}));
  expect(await loadLayer('argo', query, new AbortController().signal)).toEqual({layer: 'argo', error: 'Provider unavailable'});
});
it('requests OBIS species and bounds without unsupported date filtering', async () => {
  const fetcher = vi.fn().mockResolvedValue({ok: true, json: async () => ({results: []})});
  vi.stubGlobal('fetch', fetcher);
  await loadLayer('obis', query, new AbortController().signal);
  const url = new URL(fetcher.mock.calls[0][0], 'http://localhost');
  expect(url.searchParams.get('bbox')).toBe('50,5,78,25');
  expect(url.searchParams.get('species')).toBe('Thunnus');
  expect(url.searchParams.has('start')).toBe(false);
});
it('keeps cancellations distinct from source failures', async () => {
  const controller = new AbortController(); controller.abort();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('aborted')));
  await expect(loadLayer('argo', query, controller.signal)).rejects.toThrow('aborted');
});
