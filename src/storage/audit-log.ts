import {appendFile, mkdir} from 'node:fs/promises';
import path from 'node:path';

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeHash: string | null;
  afterHash: string | null;
  details?: Record<string, unknown>;
};

const secretKey = /(?:api[-_]?key|token|secret|password|authorization)/i;

const redact = (value: unknown, key = ''): unknown => {
  if (secretKey.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((entry) => redact(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]),
    );
  }
  return value;
};

export const appendAuditEvent = async (file: string, event: AuditEvent): Promise<void> => {
  await mkdir(path.dirname(file), {recursive: true});
  await appendFile(file, `${JSON.stringify(redact(event))}\n`, 'utf8');
};
