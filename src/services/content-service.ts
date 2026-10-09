import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {Customer, Deliverable, Order} from '../domain/schema';
import {createShortBrief, shortAngles} from '../templates/short-brief';

type ProductionInput = {
  order: Order;
  customer: Customer;
  artifactRoot: string;
  now?: () => string;
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export const buildShortBriefs = async ({order, customer, artifactRoot, now = () => new Date().toISOString()}: ProductionInput): Promise<Deliverable[]> => {
  const output = path.join(path.resolve(artifactRoot), order.id, 'shorts');
  await mkdir(output, {recursive: true});
  const timestamp = now();
  const deliverables: Deliverable[] = [];

  for (const [index, angle] of shortAngles.entries()) {
    const brief = createShortBrief(customer, angle, index);
    const serialized = `${JSON.stringify(brief, null, 2)}\n`;
    const file = path.join(output, `short-${index + 1}-${angle}.json`);
    await writeFile(file, serialized, 'utf8');
    deliverables.push({
      id: `${order.id}_short_${index + 1}`,
      orderId: order.id,
      kind: 'short-brief',
      status: 'ready',
      path: file,
      checksum: sha256(serialized),
      metadata: {angle, durationSeconds: 24, generator: 'short-brief-v1'},
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const socialCopy = `${customer.businessName}\n\n나에게 꼭 맞는 섬세한 케어를 만나보세요.\n예약: ${customer.bookingUrl || customer.contact}\n\n#뷰티 #웰니스 #맞춤케어 #예약\n`;
  const socialPath = path.join(output, 'social-copy.md');
  await writeFile(socialPath, socialCopy, 'utf8');
  deliverables.push({
    id: `${order.id}_social`,
    orderId: order.id,
    kind: 'social-copy',
    status: 'ready',
    path: socialPath,
    checksum: sha256(socialCopy),
    metadata: {generator: 'social-copy-v1'},
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return deliverables;
};
