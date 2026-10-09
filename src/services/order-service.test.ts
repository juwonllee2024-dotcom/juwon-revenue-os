import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {normalizeIntake} from './intake-service';
import {createOrderService} from './order-service';

const validIntake = {
  businessName: 'Glow Studio',
  niche: 'skin care',
  bookingUrl: 'https://example.com/book',
  services: ['Signature Facial'],
  contact: 'hello@example.com',
  tone: 'premium calm',
  colors: ['#171411', '#E5C994'],
  sourceMedia: [],
  consent: true,
  demo: true,
};

const setup = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'revenue-order-'));
  return createOrderService({
    stateFile: path.join(root, 'state.json'),
    auditFile: path.join(root, 'audit.jsonl'),
    uploadRoot: path.join(root, 'uploads'),
    now: () => '2026-08-04T00:00:00.000Z',
  });
};

describe('order lifecycle', () => {
  it('blocks delivery before approval', async () => {
    const service = await setup();
    const order = await service.createOrder(validIntake);

    await expect(service.transitionOrder(order.id, 'delivered', 'operator')).rejects.toThrow(
      'approval required',
    );
  });

  it('allows review to return to production', async () => {
    const service = await setup();
    let order = await service.createOrder(validIntake);
    for (const state of ['planned', 'producing', 'review'] as const) {
      order = await service.transitionOrder(order.id, state, 'operator');
    }

    order = await service.transitionOrder(order.id, 'producing', 'operator');
    expect(order.status).toBe('producing');
  });

  it('rejects source media outside the upload root', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'revenue-upload-'));
    expect(() =>
      normalizeIntake({...validIntake, sourceMedia: [path.resolve(root, '..', 'secret.jpg')]}, root),
    ).toThrow('outside upload root');
  });
});
