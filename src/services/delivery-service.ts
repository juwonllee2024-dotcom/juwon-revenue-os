import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {manifestHashFor, type OrderService} from './order-service';
import {writeStoredZip} from './zip-store';

const sha256 = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');

const ensureInside = (candidate: string, root: string): string => {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('artifact is outside order root');
  return resolved;
};

const listFiles = async (candidate: string): Promise<string[]> => {
  const stats = await lstat(candidate);
  if (stats.isSymbolicLink()) throw new Error('symbolic links are not allowed');
  if (stats.isFile()) return [candidate];
  const children = await readdir(candidate);
  const nested = await Promise.all(children.sort().map((child) => listFiles(path.join(candidate, child))));
  return nested.flat();
};

export const createDeliveryService = (
  orders: OrderService,
  artifactRoot: string,
  now: () => string = () => new Date().toISOString(),
) => ({
  async buildCaseStudy(orderId: string): Promise<string> {
    const order = await orders.getOrder(orderId);
    const customer = await orders.getCustomerForOrder(orderId);
    return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${customer.businessName} 사례</title><body><main><h1>${customer.businessName}</h1><h2>과제</h2><p>온라인 예약과 지속적인 숏폼 홍보를 하나의 흐름으로 연결합니다.</p><h2>과정</h2><p>고객 접수 → 웹사이트·쇼츠 4개 기획 → 검수 → 승인 → 납품</p><h2>결과물</h2><p>랜딩 웹사이트 1개, 쇼츠 기획 4개, SNS 문구, 검증 가능한 납품 패키지</p><h2>측정 결과</h2><p>조회수·문의·예약 전환: 측정 전</p><h2>공개 상태</h2><p>고객 공개 동의: ${customer.consent ? '확인' : '미확인'}</p><p>주문 증거 해시: ${order.manifestHash || '없음'}</p></main></body></html>`;
  },

  async buildDelivery(orderId: string) {
    const order = await orders.getOrder(orderId);
    const currentHash = manifestHashFor(order.deliverables);
    if (order.approval?.state !== 'approved' || order.approval.manifestHash !== currentHash) {
      throw new Error('approval required before delivery');
    }
    const orderRoot = path.join(path.resolve(artifactRoot), orderId);
    const deliveryRoot = path.join(orderRoot, 'delivery');
    await mkdir(deliveryRoot, {recursive: true});
    const sourceFiles = (
      await Promise.all(
        order.deliverables.map(async (item) => listFiles(ensureInside(item.path, orderRoot))),
      )
    ).flat();
    const caseStudy = await this.buildCaseStudy(orderId);
    const caseStudyPath = path.join(deliveryRoot, 'case-study.html');
    const readme = `<!doctype html><meta charset="utf-8"><h1>납품 완료</h1><p>웹사이트, 쇼츠 기획 4개, SNS 문구가 포함되어 있습니다.</p><p>승인 해시: ${currentHash}</p>`;
    const readmePath = path.join(deliveryRoot, 'README.html');
    await Promise.all([
      writeFile(caseStudyPath, caseStudy, 'utf8'),
      writeFile(readmePath, readme, 'utf8'),
    ]);
    const packageFiles = [...sourceFiles, readmePath, caseStudyPath];
    const entries = await Promise.all(
      packageFiles.map(async (file) => {
        const data = await readFile(file);
        return {path: file, name: path.relative(orderRoot, file).replaceAll('\\', '/'), data, checksum: sha256(data)};
      }),
    );
    const manifest = {
      orderId,
      generatedAt: now(),
      approvalId: order.approval.id,
      approvalHash: currentHash,
      files: entries.map(({name, checksum, data}) => ({path: name, checksum, bytes: data.length})),
    };
    const manifestPath = path.join(deliveryRoot, 'delivery-manifest.json');
    const zipPath = path.join(deliveryRoot, `${orderId}-delivery.zip`);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await writeStoredZip(zipPath, entries.map(({name, data}) => ({name, data})));
    await orders.transitionOrder(orderId, 'delivered', order.approval.operator || 'operator');
    return {manifestPath, caseStudyPath, readmePath, zipPath};
  },
});

export type DeliveryService = ReturnType<typeof createDeliveryService>;
