import type { AuthorityLookupResult, ReportPayload } from '@fixlocal/shared';
import { env } from '../env.js';
import { supabase } from '../lib/supabase.js';

type AuthorityRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  state: string;
  zip: string | null;
  is_default: boolean;
};

export type AuthorityRepository = {
  findByZip: (zip: string) => Promise<AuthorityRow | null>;
  findByCityState: (city: string, state: string) => Promise<AuthorityRow | null>;
  findDefault: () => Promise<AuthorityRow | null>;
};

const normalizeZip = (zip: string): string => zip.trim().slice(0, 5);
const normalizeCity = (city: string): string => city.trim().toLowerCase();
const normalizeState = (state: string): string => state.trim().toLowerCase();

export const createAuthorityService = (repository: AuthorityRepository) => {
  return {
    async lookup(location: ReportPayload['location']): Promise<AuthorityLookupResult> {
      const normalizedZip = normalizeZip(location.zip);
      if (normalizedZip) {
        const zipMatch = await repository.findByZip(normalizedZip);
        if (zipMatch) {
          return {
            name: zipMatch.name,
            email: zipMatch.email,
            phone: zipMatch.phone,
            source: 'exact',
          };
        }
      }

      const cityMatch = await repository.findByCityState(
        normalizeCity(location.city),
        normalizeState(location.state),
      );

      if (cityMatch) {
        return {
          name: cityMatch.name,
          email: cityMatch.email,
          phone: cityMatch.phone,
          source: 'city_fallback',
        };
      }

      const defaultMatch = await repository.findDefault();
      if (defaultMatch) {
        return {
          name: defaultMatch.name,
          email: defaultMatch.email,
          phone: defaultMatch.phone,
          source: 'default',
        };
      }

      return {
        name: env.DEFAULT_CONTACT_NAME,
        email: env.DEFAULT_CONTACT_EMAIL,
        phone: null,
        source: 'default',
      };
    },
  };
};

const authorityColumns = 'id, name, email, phone, city, state, zip, is_default';

const authorityRepository: AuthorityRepository = {
  async findByZip(zip: string) {
    const { data, error } = await supabase
      .from('authorities')
      .select(authorityColumns)
      .eq('zip', zip)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed zip authority lookup: ${error.message}`);
    }

    return data;
  },
  async findByCityState(city: string, state: string) {
    const { data, error } = await supabase
      .from('authorities')
      .select(authorityColumns)
      .ilike('city', city)
      .ilike('state', state)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed city authority lookup: ${error.message}`);
    }

    return data;
  },
  async findDefault() {
    const { data, error } = await supabase
      .from('authorities')
      .select(authorityColumns)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed default authority lookup: ${error.message}`);
    }

    return data;
  },
};

export const authorityService = createAuthorityService(authorityRepository);
