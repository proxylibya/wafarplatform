// The route map's guest rule: Home, Parts, and Catalog are the three public
// destinations, so a guest's Catalog href stays `/catalogs` while the six
// merchant-area destinations send the guest to sign-in (FR-048, AC-052; T227).
import { describe, expect, it } from 'vitest';
import { destinationFor, merchantAreaPaths, sidebarDestinations } from '@wafar/shared';

describe('the route map', () => {
  it('keeps the three public destinations and redirects the six merchant-area ones', () => {
    expect(merchantAreaPaths).toEqual([
      '/upload',
      '/my-files',
      '/cart',
      '/notifications',
      '/messages',
      '/profile',
    ]);
    expect(destinationFor('/', true)).toBe('/');
    expect(destinationFor('/parts', true)).toBe('/parts');
    expect(destinationFor('/catalogs', true)).toBe('/catalogs');
    for (const path of merchantAreaPaths) {
      expect(destinationFor(path, true), path).toBe('/auth/sign-in');
      expect(destinationFor(path, false), path).toBe(path);
    }
  });

  it('sends a guest to `/catalogs` from the sidebar’s Catalog entry', () => {
    const catalogs = sidebarDestinations.find((item) => item.key === 'catalogs');
    expect(catalogs?.path).toBe('/catalogs');
    expect(destinationFor(catalogs?.path ?? '', true)).toBe('/catalogs');
  });
});
