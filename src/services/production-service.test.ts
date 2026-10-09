import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {expect, it} from 'vitest';
import {createOrderService} from './order-service';
import {createProductionService} from './production-service';

it('moves one intake order to review with website, four shorts, and social copy', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'revenue-production-'));
  const orders = createOrderService({
    stateFile: path.join(root, 'state.json'),
    auditFile: path.join(root, 'audit.jsonl'),
    uploadRoot: path.join(root, 'uploads'),
  });
  const order = await orders.createOrder({
    businessName: 'Glow Studio',
    niche: 'skin care',
    services: ['Facial'],
    contact: 'hello@example.com',
    consent: true,
    demo: true,
  });
  const production = createProductionService(orders, path.join(root, 'artifacts'));

  const reviewed = await production.produce(order.id);

  expect(reviewed.status).toBe('review');
  expect(reviewed.deliverables.filter((item) => item.kind === 'short-brief')).toHaveLength(4);
  expect(reviewed.deliverables.some((item) => item.kind === 'website')).toBe(true);
  expect(reviewed.deliverables.some((item) => item.kind === 'social-copy')).toBe(true);
});
