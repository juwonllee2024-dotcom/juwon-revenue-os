import {describe, expect, it} from 'vitest';
import {CustomerSchema, OrderSchema} from './schema';

describe('revenue domain', () => {
  it('rejects a booking URL that can execute script', () => {
    expect(() =>
      CustomerSchema.parse({
        id: 'c1',
        businessName: 'Glow',
        niche: 'skin',
        bookingUrl: 'javascript:alert(1)',
        services: ['facial'],
        contact: 'hello@example.com',
      }),
    ).toThrow();
  });

  it('requires exactly four shorts in the MVP package', () => {
    expect(() =>
      OrderSchema.parse({
        id: 'o1',
        customerId: 'c1',
        status: 'intake',
        shortCount: 3,
        deliverables: [],
        createdAt: '2026-08-04T00:00:00.000Z',
        updatedAt: '2026-08-04T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
