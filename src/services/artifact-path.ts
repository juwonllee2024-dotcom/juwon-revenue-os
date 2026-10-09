import path from 'node:path';

export const resolveArtifactPath = (artifactRoot: string, orderId: string, segments: string[]): string => {
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(orderId)) throw new Error('invalid order id');
  if (segments.length === 0 || segments.some((segment) => !segment || segment.includes('\0'))) {
    throw new Error('invalid artifact path');
  }
  const orderRoot = path.resolve(artifactRoot, orderId);
  const candidate = path.resolve(orderRoot, ...segments);
  const relative = path.relative(orderRoot, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('outside order root');
  return candidate;
};
