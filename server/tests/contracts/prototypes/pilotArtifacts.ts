// Generates the integrated contract and client declarations from server-owned schemas.
// Tools remain isolated from the runtime dependency tree and do not import the database.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';
import prettier from 'prettier';
import { createPilotDocument } from '../../../src/schemas/openapi.js';
import { generateTypes } from './documents.js';

export async function renderPilotArtifacts(): Promise<Map<string, string>> {
  const document = createPilotDocument();
  const sources = [
    {
      path: new URL('../../../contracts/pilot.openapi.json', import.meta.url),
      content: JSON.stringify(document),
      parser: 'json',
    },
    {
      path: new URL('../../../../client/src/api/generated.ts', import.meta.url),
      content: '// Generated from openapi.ts::createPilotDocument; do not edit.\n' + (await generateTypes(document)),
      parser: 'typescript',
    },
  ];
  const result = new Map<string, string>();
  for (const source of sources) {
    const path = fileURLToPath(source.path);
    const config = await prettier.resolveConfig(path);
    const requireAtTarget = createRequire(path);
    result.set(
      path,
      await prettier.format(source.content, {
        ...config,
        plugins: config?.plugins?.map(plugin =>
          typeof plugin === 'string' ? requireAtTarget.resolve(plugin) : plugin,
        ),
        parser: source.parser,
      }),
    );
  }
  return result;
}

export function assertCurrentArtifact(path: string, actual: string, expected: string): void {
  if (actual !== expected) throw new Error(`Stale generated artifact: ${path}`);
}

export async function writeOrCheckPilotArtifacts(check: boolean) {
  for (const [path, content] of await renderPilotArtifacts()) {
    if (check) assertCurrentArtifact(path, await readFile(path, 'utf8'), content);
    else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
    }
    process.stdout.write(`${path}: ${check ? 'current' : 'generated'}\n`);
  }
}
