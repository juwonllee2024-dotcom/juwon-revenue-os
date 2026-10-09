import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {z} from 'zod';
import {describe, expect, it} from 'vitest';
import {appendAuditEvent} from './audit-log';
import {createJsonStore} from './json-store';

const StateSchema = z.object({
  version: z.literal(1),
  customers: z.array(z.string()),
  orders: z.array(z.string()),
});

describe('atomic JSON store', () => {
  it('never replaces valid state with invalid state', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'revenue-store-'));
    const file = path.join(dir, 'state.json');
    const store = createJsonStore(file, StateSchema);

    await store.write({version: 1, customers: [], orders: []});
    await expect(store.write({version: 1} as never)).rejects.toThrow();

    expect((await store.read()).orders).toEqual([]);
  });

  it('recovers from a corrupt primary file using the validated backup', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'revenue-recovery-'));
    const file = path.join(dir, 'state.json');
    const store = createJsonStore(file, StateSchema);
    await store.write({version: 1, customers: ['first'], orders: []});
    await store.write({version: 1, customers: ['second'], orders: []});
    await writeFile(file, '{broken', 'utf8');

    expect((await store.read()).customers).toEqual(['first']);
  });

  it('appends one redacted audit event per line', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'revenue-audit-'));
    const file = path.join(dir, 'audit.jsonl');
    await appendAuditEvent(file, {
      id: 'audit_1',
      at: '2026-08-04T00:00:00.000Z',
      actor: 'operator',
      action: 'order.created',
      entityType: 'order',
      entityId: 'order_1',
      beforeHash: null,
      afterHash: 'a'.repeat(64),
      details: {apiKey: 'secret', safe: 'visible'},
    });

    const saved = JSON.parse((await readFile(file, 'utf8')).trim());
    expect(saved.details).toEqual({apiKey: '[REDACTED]', safe: 'visible'});
  });
});
