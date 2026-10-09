import {copyFile, mkdir, open, readFile, rename, rm} from 'node:fs/promises';
import path from 'node:path';
import type {ZodType} from 'zod';

export type JsonStore<T> = {
  read(): Promise<T>;
  write(value: T): Promise<void>;
};

const parseFile = async <T>(file: string, schema: ZodType<T>): Promise<T> => {
  const raw = await readFile(file, 'utf8');
  return schema.parse(JSON.parse(raw));
};

export const createJsonStore = <T>(file: string, schema: ZodType<T>): JsonStore<T> => {
  const backup = `${file}.bak`;

  return {
    async read() {
      try {
        return await parseFile(file, schema);
      } catch (primaryError) {
        try {
          return await parseFile(backup, schema);
        } catch {
          throw primaryError;
        }
      }
    },

    async write(value) {
      const validated = schema.parse(value);
      const parent = path.dirname(file);
      await mkdir(parent, {recursive: true});
      const pending = `${file}.pending-${process.pid}-${Date.now()}`;

      try {
        try {
          await parseFile(file, schema);
          await copyFile(file, backup);
        } catch {
          // A missing or invalid primary must never replace a valid backup.
        }

        const handle = await open(pending, 'wx');
        try {
          await handle.writeFile(`${JSON.stringify(validated, null, 2)}\n`, 'utf8');
          await handle.sync();
        } finally {
          await handle.close();
        }
        await rename(pending, file);
      } catch (error) {
        await rm(pending, {force: true}).catch(() => undefined);
        throw error;
      }
    },
  };
};
