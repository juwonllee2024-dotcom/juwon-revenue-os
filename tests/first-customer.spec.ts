import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {expect, test} from '@playwright/test';

const execFileAsync = promisify(execFile);

test('golden rehearsal stops at approval and preserves every proof', async ({request}) => {
  const {stdout} = await execFileAsync(process.execPath, ['scripts/rehearse-first-customer.mjs'], {
    cwd: process.cwd(),
    env: {...process.env, REVENUE_OS_URL: 'http://127.0.0.1:10640'},
  });
  expect(stdout).toContain('APPROVAL=pending');
  expect(stdout).toContain('외부 게시: 실행 안 함');

  const stateResponse = await request.get('/api/orders');
  expect(stateResponse.ok()).toBe(true);
  const state = await stateResponse.json();
  const order = state.orders.at(-1);
  expect(order.status).toBe('review');
  expect(order.approval.state).toBe('pending');
  expect(order.deliverables.filter((item: {kind: string}) => item.kind === 'short-brief')).toHaveLength(4);
  expect(order.deliverables.some((item: {kind: string}) => item.kind === 'website')).toBe(true);
  expect(order.deliverables.every((item: {checksum?: string}) => typeof item.checksum === 'string' && /^[a-f0-9]{64}$/.test(item.checksum))).toBe(true);

  const blockedDelivery = await request.post(`/api/orders/${order.id}/delivery`);
  expect(blockedDelivery.status()).toBe(400);
  const integrationHealth = await request.get('/api/integrations/health');
  expect(integrationHealth.ok()).toBe(true);
  const traversal = await request.get(`/api/artifacts/${order.id}/%2e%2e/secret.json`);
  expect(traversal.status()).toBe(404);
});
