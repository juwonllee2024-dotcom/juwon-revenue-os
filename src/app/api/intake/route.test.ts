import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {createOrderService} from '../../../services/order-service';
import {createIntakeHandler} from './handler';

describe('POST /api/intake', () => {
  it('returns a validated four-short order', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'revenue-route-'));
    const service = createOrderService({
      stateFile: path.join(root, 'state.json'),
      auditFile: path.join(root, 'audit.jsonl'),
      uploadRoot: path.join(root, 'uploads'),
    });
    const handler = createIntakeHandler(service);
    const response = await handler(
      new Request('http://127.0.0.1/api/intake', {
        method: 'POST',
        body: JSON.stringify({
          businessName: 'Glow Studio',
          niche: 'skin care',
          services: ['Facial'],
          contact: 'hello@example.com',
          consent: true,
          demo: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect((await response.json()).order.shortCount).toBe(4);
  });
});
