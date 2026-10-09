import {createServer} from 'node:http';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {createCompanyOsClient} from './company-os';
import {buildRenderCommand} from './remotion';

const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe('Company OS adapter', () => {
  it('returns offline instead of crashing when Company OS is unavailable', async () => {
    const client = createCompanyOsClient('http://127.0.0.1:1', 100);
    expect(await client.getHealth()).toEqual({status: 'offline'});
  });

  it('reads health and truth without mutation calls', async () => {
    const requests: string[] = [];
    const server = createServer((request, response) => {
      requests.push(`${request.method} ${request.url}`);
      response.setHeader('content-type', 'application/json');
      response.end(request.url === '/healthz' ? '{"ok":true}' : '{"companies":1}');
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('test server did not bind');
    const client = createCompanyOsClient(`http://127.0.0.1:${address.port}`, 500);

    expect(await client.getHealth()).toEqual({status: 'online', data: {ok: true}});
    expect(await client.getTruth()).toEqual({status: 'online', data: {companies: 1}});
    expect(requests).toEqual(['GET /healthz', 'GET /api/truth']);
  });
});

describe('Remotion adapter', () => {
  it('rejects output outside the order artifact root', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'revenue-remotion-'));
    expect(() =>
      buildRenderCommand({
        projectRoot: path.join(root, 'remotion'),
        artifactRoot: path.join(root, 'artifacts'),
        orderId: 'order_1',
        composition: 'BeautyShort',
        output: 'C:\\Windows\\x.mp4',
        frameRange: [0, 719],
      }),
    ).toThrow('outside artifact root');
  });

  it('returns an argument array with no shell interpolation', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'revenue-remotion-'));
    const artifactRoot = path.join(root, 'artifacts');
    const output = path.join(artifactRoot, 'order_1', 'shorts', 'short-1.mp4');
    const command = buildRenderCommand({
      projectRoot: path.join(root, 'remotion'),
      artifactRoot,
      orderId: 'order_1',
      composition: 'BeautyShort',
      output,
      frameRange: [0, 719],
    });

    expect(command.shell).toBe(false);
    expect(command.args).toEqual(['exec', '--', 'remotion', 'render', 'BeautyShort', output, '--frames', '0-719']);
  });
});
