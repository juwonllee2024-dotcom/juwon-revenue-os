import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {Customer, Deliverable, Order} from '../domain/schema';
import {beautyLandingCss, renderBeautyLanding} from '../templates/beauty-landing';

type ProductionInput = {
  order: Order;
  customer: Customer;
  artifactRoot: string;
  now?: () => string;
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export const buildLandingBundle = async ({order, customer, artifactRoot, now = () => new Date().toISOString()}: ProductionInput): Promise<Deliverable> => {
  const output = path.join(path.resolve(artifactRoot), order.id, 'website');
  await mkdir(output, {recursive: true});
  const html = renderBeautyLanding(customer);
  const manifest = {
    orderId: order.id,
    generator: 'juwon-revenue-os/beauty-landing-v1',
    generatedAt: now(),
    approval: 'pending',
    sourceInputHash: sha256(JSON.stringify(customer)),
    files: [
      {path: 'index.html', checksum: sha256(html)},
      {path: 'styles.css', checksum: sha256(beautyLandingCss)},
    ],
  };
  await Promise.all([
    writeFile(path.join(output, 'index.html'), html, 'utf8'),
    writeFile(path.join(output, 'styles.css'), beautyLandingCss, 'utf8'),
    writeFile(path.join(output, 'site-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
  ]);
  const timestamp = now();
  return {
    id: `${order.id}_website`,
    orderId: order.id,
    kind: 'website',
    status: 'ready',
    path: output,
    checksum: sha256(`${html}${beautyLandingCss}`),
    metadata: {generator: manifest.generator},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
