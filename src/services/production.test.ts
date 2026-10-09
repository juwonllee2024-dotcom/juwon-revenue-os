import {mkdtemp, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {CustomerSchema, OrderSchema} from '../domain/schema';
import {buildShortBriefs} from './content-service';
import {buildLandingBundle} from './website-service';

const customer = CustomerSchema.parse({
  id: 'customer_1',
  businessName: '<script>alert(1)</script> Glow Studio',
  niche: 'skin care',
  bookingUrl: 'https://example.com/book',
  services: ['Signature Facial', 'LED Care'],
  contact: 'hello@example.com',
  tone: 'premium calm',
  colors: ['#171411', '#E5C994'],
  sourceMedia: [],
  consent: true,
  demo: true,
});

const order = OrderSchema.parse({
  id: 'order_1',
  customerId: customer.id,
  status: 'planned',
  shortCount: 4,
  deliverables: [],
  createdAt: '2026-08-04T00:00:00.000Z',
  updatedAt: '2026-08-04T00:00:00.000Z',
});

describe('production services', () => {
  it('builds a safe complete landing bundle', async () => {
    const artifactRoot = await mkdtemp(path.join(tmpdir(), 'revenue-site-'));
    const deliverable = await buildLandingBundle({
      order,
      customer,
      artifactRoot,
      now: () => '2026-08-04T00:00:00.000Z',
    });
    const html = await readFile(path.join(deliverable.path, 'index.html'), 'utf8');

    expect(html).toContain('Signature Facial');
    expect(html).toContain('고객 후기');
    expect(html).toContain('예약하기');
    expect(html).toContain('개인정보');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('creates four distinct short briefs with social copy', async () => {
    const artifactRoot = await mkdtemp(path.join(tmpdir(), 'revenue-shorts-'));
    const deliverables = await buildShortBriefs({
      order,
      customer,
      artifactRoot,
      now: () => '2026-08-04T00:00:00.000Z',
    });
    const briefs = await Promise.all(
      deliverables
        .filter((item) => item.kind === 'short-brief')
        .map((item) => readFile(item.path, 'utf8').then(JSON.parse)),
    );

    expect(briefs).toHaveLength(4);
    expect(briefs.map((brief) => brief.angle)).toEqual([
      'transformation',
      'expertise',
      'offer',
      'customer-story',
    ]);
    expect(deliverables.some((item) => item.kind === 'social-copy')).toBe(true);
  });
});
