// Builds deterministic comparison artifacts for the CLI and the gate's freshness checks.
// It does not import the application, start a server, or touch the database.

import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { candidateFactories } from './candidates.js';
import { generateTypes } from './documents.js';
import { measureComparison } from './measure.js';

export async function renderArtifacts(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  async function render(file: string, source: string, parser: string) {
    const target = new URL(`generated/${file}`, import.meta.url);
    result.set(
      file,
      await prettier.format(source, {
        ...(await prettier.resolveConfig(fileURLToPath(target))),
        parser,
      }),
    );
  }
  for (const create of candidateFactories) {
    const candidate = create();
    const document = candidate.document();
    await render(`${candidate.name}.openapi.json`, JSON.stringify(document), 'json');
    await render(`${candidate.name}.d.ts`, await generateTypes(document), 'typescript');
  }
  await render('measurements.json', JSON.stringify(await measureComparison()), 'json');
  return result;
}
