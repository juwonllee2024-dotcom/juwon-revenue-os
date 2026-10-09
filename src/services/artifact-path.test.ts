import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {resolveArtifactPath} from './artifact-path';

describe('artifact path confinement', () => {
  it('allows a file under the requested order', () => {
    expect(resolveArtifactPath('C:\\safe\\artifacts', 'order_1', ['delivery', 'case-study.html'])).toBe(
      path.resolve('C:\\safe\\artifacts', 'order_1', 'delivery', 'case-study.html'),
    );
  });

  it('rejects traversal and another order', () => {
    expect(() => resolveArtifactPath('C:\\safe\\artifacts', 'order_1', ['..', 'order_2', 'secret'])).toThrow(
      'outside order root',
    );
  });
});
