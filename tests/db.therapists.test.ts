import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as supabaseServer from '../lib/supabase/server';
import * as therapistsModule from '../lib/db/therapists';

describe('lib/db/therapists', () => {
  const mockClient = {
    from: (table: string) => {
      if (table === 'therapists') {
        return {
          select: (_cols?: string) => ({
            order: (_col: string, _opts: any) => Promise.resolve({ data: [{ id: 't1', name: 'Alice', bio: 'Therapist' }], error: null }),
          }),
          insert: (payload: any) => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 't2', ...payload }, error: null }),
            }),
          }),
          update: (payload: any) => ({
            eq: (_col: string, val: any) => ({
              select: () => ({
                single: () => Promise.resolve({ data: { id: val, ...payload }, error: null }),
              }),
            }),
          }),
          delete: () => ({ eq: (_col: string, val: any) => Promise.resolve({ error: null }) }),
        };
      }
      return {
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      };
    },
  } as any;

  beforeEach(() => {
    vi.spyOn(supabaseServer, 'getServerSupabaseClient').mockResolvedValue(mockClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listTherapists returns array', async () => {
    const list = await therapistsModule.listTherapists();
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].name).toBe('Alice');
  });

  it('createTherapist returns created therapist', async () => {
    const created = await therapistsModule.createTherapist({ name: 'Bob' } as any);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Bob');
  });

  it('updateTherapist returns updated', async () => {
    const updated = await therapistsModule.updateTherapist('t2', { name: 'Bobby' });
    expect(updated.id).toBe('t2');
    expect(updated.name).toBe('Bobby');
  });

  it('deleteTherapist resolves true', async () => {
    const res = await therapistsModule.deleteTherapist('t2');
    expect(res).toBe(true);
  });
});
