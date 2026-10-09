import path from 'node:path';

type RenderInput = {
  projectRoot: string;
  artifactRoot: string;
  orderId: string;
  composition: 'BeautyShort';
  output: string;
  frameRange: [number, number];
};

export type RenderCommand = {
  command: 'npm.cmd';
  args: string[];
  cwd: string;
  shell: false;
};

const ensureInside = (candidate: string, root: string): string => {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('output is outside artifact root');
  }
  return resolved;
};

export const buildRenderCommand = (input: RenderInput): RenderCommand => {
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(input.orderId)) throw new Error('invalid order id');
  if (input.composition !== 'BeautyShort') throw new Error('composition is not allowlisted');
  const [from, to] = input.frameRange;
  if (![from, to].every(Number.isInteger) || from < 0 || to < from || to > 18_000) {
    throw new Error('invalid frame range');
  }
  const orderShortRoot = path.join(path.resolve(input.artifactRoot), input.orderId, 'shorts');
  const output = ensureInside(input.output, orderShortRoot);
  if (path.extname(output).toLowerCase() !== '.mp4') throw new Error('output must be mp4');

  return {
    command: 'npm.cmd',
    args: ['exec', '--', 'remotion', 'render', input.composition, output, '--frames', `${from}-${to}`],
    cwd: path.resolve(input.projectRoot),
    shell: false,
  };
};
