import {mkdtemp, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {createApprovalService} from './approval-service';
import {buildShortBriefs} from './content-service';
import {createDeliveryService} from './delivery-service';
import {createOrderService} from './order-service';
import {buildLandingBundle} from './website-service';

const intake = {
  businessName: 'Glow Studio',
  niche: 'skin care',
  bookingUrl: 'https://example.com/book',
  services: ['Signature Facial'],
  contact: 'hello@example.com',
  consent: true,
  demo: true,
};

const setup = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'revenue-delivery-'));
  const now = () => '2026-08-04T00:00:00.000Z';
  const orders = createOrderService({
    stateFile: path.join(root, 'data', 'state.json'),
    auditFile: path.join(root, 'data', 'audit.jsonl'),
    uploadRoot: path.join(root, 'data', 'uploads'),
    now,
  });
  let order = await orders.createOrder(intake);
  order = await orders.transitionOrder(order.id, 'planned', 'operator');
  order = await orders.transitionOrder(order.id, 'producing', 'operator');
  const customer = await orders.getCustomerForOrder(order.id);
  const website = await buildLandingBundle({order, customer, artifactRoot: path.join(root, 'artifacts'), now});
  const content = await buildShortBriefs({order, customer, artifactRoot: path.join(root, 'artifacts'), now});
  order = await orders.recordDeliverables(order.id, [website, ...content], 'operator');
  const approvals = createApprovalService(orders, now);
  const delivery = createDeliveryService(orders, path.join(root, 'artifacts'), now);
  return {root, orders, approvals, delivery, order};
};

describe('approval and delivery proof chain', () => {
  it('refuses delivery before approval', async () => {
    const {delivery, order} = await setup();
    await expect(delivery.buildDelivery(order.id)).rejects.toThrow('approval required');
  });

  it('creates checksummed delivery, zip, and truthful case study after approval', async () => {
    const {approvals, delivery, order} = await setup();
    const pending = await approvals.requestApproval(order.id);
    await approvals.resolveApproval({
      orderId: order.id,
      operator: 'Juwon',
      decision: 'approved',
      note: '검수 완료',
      manifestHash: pending.manifestHash,
    });

    const result = await delivery.buildDelivery(order.id);
    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8'));
    const caseStudy = await readFile(result.caseStudyPath, 'utf8');
    const zip = await readFile(result.zipPath);

    expect(manifest.files.every((file: {checksum: string}) => /^[a-f0-9]{64}$/.test(file.checksum))).toBe(true);
    expect(zip.subarray(0, 2).toString()).toBe('PK');
    expect(caseStudy).toContain('측정 전');
    expect(caseStudy).toContain('고객 공개 동의: 확인');
  });

  it('invalidates approval when deliverables change', async () => {
    const {approvals, orders, order} = await setup();
    const pending = await approvals.requestApproval(order.id);
    await approvals.resolveApproval({
      orderId: order.id,
      operator: 'Juwon',
      decision: 'approved',
      note: '',
      manifestHash: pending.manifestHash,
    });
    const approved = await orders.getOrder(order.id);
    const changed = approved.deliverables.map((item, index) =>
      index === 0 ? {...item, checksum: 'f'.repeat(64)} : item,
    );

    const updated = await orders.recordDeliverables(order.id, changed, 'operator');
    expect(updated.approval).toBeUndefined();
    expect(updated.status).toBe('review');
  });
});
