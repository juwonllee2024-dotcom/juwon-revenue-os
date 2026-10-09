import {readFile} from 'node:fs/promises';

const baseUrl = new URL(process.env.REVENUE_OS_URL || 'http://127.0.0.1:10640');
if (baseUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(baseUrl.hostname)) {
  throw new Error('REVENUE_OS_URL must be local HTTP');
}

const fixture = JSON.parse(await readFile(new URL('../fixtures/demo-glow-studio.json', import.meta.url), 'utf8'));

const post = async (pathname, body) => {
  const response = await fetch(new URL(pathname, baseUrl), {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${pathname}: ${result.error || response.status}`);
  return result;
};

const created = await post('/api/intake', fixture);
const produced = await post(`/api/orders/${created.order.id}/produce`);
const requested = await post(`/api/orders/${created.order.id}/approval`, {action: 'request'});

if (produced.order.deliverables.filter((item) => item.kind === 'short-brief').length !== 4) {
  throw new Error('rehearsal did not create four short briefs');
}

console.log(`ORDER=${created.order.id}`);
console.log(`APPROVAL=${requested.approval.state}`);
console.log(`REVIEW_URL=${new URL(`/?order=${created.order.id}`, baseUrl)}`);
console.log('외부 게시: 실행 안 함');
console.log('결제: 실행 안 함');
