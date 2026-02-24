import { describe, expect, it } from 'vitest';
import { createAuthorityService, type AuthorityRepository } from '../src/services/authority.js';

const baseLocation = {
  latitude: 39.9,
  longitude: -75.1,
  city: 'Philadelphia',
  state: 'PA',
  zip: '19103',
  formattedAddress: '123 Main St, Philadelphia, PA 19103',
};

describe('authority lookup', () => {
  it('prefers zip matches when available', async () => {
    const repo: AuthorityRepository = {
      findByZip: async () => ({
        id: '1',
        name: 'Zip Team',
        email: 'zip@example.gov',
        phone: null,
        city: 'Philadelphia',
        state: 'PA',
        zip: '19103',
        is_default: false,
      }),
      findByCityState: async () => ({
        id: '2',
        name: 'City Team',
        email: 'city@example.gov',
        phone: null,
        city: 'Philadelphia',
        state: 'PA',
        zip: null,
        is_default: false,
      }),
      findDefault: async () => null,
    };

    const service = createAuthorityService(repo);
    const result = await service.lookup(baseLocation);

    expect(result.email).toBe('zip@example.gov');
    expect(result.source).toBe('exact');
  });

  it('falls back to default when no zip/city match exists', async () => {
    const repo: AuthorityRepository = {
      findByZip: async () => null,
      findByCityState: async () => null,
      findDefault: async () => ({
        id: '3',
        name: 'Default Team',
        email: 'default@example.gov',
        phone: '555-0100',
        city: 'Anytown',
        state: 'US',
        zip: null,
        is_default: true,
      }),
    };

    const service = createAuthorityService(repo);
    const result = await service.lookup({ ...baseLocation, city: 'Unknown', zip: '00000' });

    expect(result.email).toBe('default@example.gov');
    expect(result.source).toBe('default');
  });
});
