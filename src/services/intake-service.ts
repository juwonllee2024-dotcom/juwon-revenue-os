import path from 'node:path';
import {IntakeSchema, type Intake} from '../domain/schema';

const confinedPath = (candidate: string, root: string): string => {
  const safeRoot = path.resolve(root);
  const resolved = path.resolve(safeRoot, candidate);
  const relative = path.relative(safeRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('source media is outside upload root');
  }
  return resolved;
};

export const normalizeIntake = (input: unknown, uploadRoot: string): Intake => {
  const parsed = IntakeSchema.parse(input);
  return {
    ...parsed,
    businessName: parsed.businessName.trim(),
    niche: parsed.niche.trim(),
    services: parsed.services.map((service) => service.trim()),
    contact: parsed.contact.trim(),
    tone: parsed.tone.trim(),
    sourceMedia: parsed.sourceMedia.map((file) => confinedPath(file, uploadRoot)),
  };
};
