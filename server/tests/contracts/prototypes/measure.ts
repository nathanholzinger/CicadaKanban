// Reproducible structural and field-change measurements. Source-line counts are supporting
// evidence; behavioral parity is established separately by the shared HTTP corpus.

import { readFile } from 'node:fs/promises';
import { candidateFactories } from './candidates.js';
import { generateTypes, documentValidator } from './documents.js';
import {
  basicConsumer,
  compileConsumer,
  consumerCompilerVersion,
  optionalFieldConsumer,
  responseFieldConsumer,
} from './typeChecks.js';
import type { Change } from './model.js';

export async function measureComparison() {
  const sourcePaths = [
    'model.ts',
    'preflightApp.ts',
    'documents.ts',
    'zod-shapes.ts',
    'zod-library/index.ts',
    'zod-native/index.ts',
    'typebox-ajv/index.ts',
  ];
  const sourceLines = Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async name => {
        const source = await readFile(new URL(name, import.meta.url), 'utf8');
        return [name, source.split(/\r?\n/).filter(line => line.trim()).length];
      }),
    ),
  );
  const manifest = JSON.parse(await readFile(new URL('package.json', import.meta.url), 'utf8'));
  const candidates = [];
  for (const create of candidateFactories) {
    const candidate = create();
    const document = candidate.document();
    const types = await generateTypes(document);
    const changes = [];
    for (const change of ['optional-request-field', 'required-response-field', 'workphase-not-null'] as Change[]) {
      const changed = create(change);
      const changedDocument = changed.document();
      const changedTypes = await generateTypes(changedDocument);
      const consumer =
        change === 'optional-request-field'
          ? optionalFieldConsumer
          : change === 'required-response-field'
            ? responseFieldConsumer
            : basicConsumer;
      changes.push({
        change,
        documentChanged: JSON.stringify(document) !== JSON.stringify(changedDocument),
        generatedTypesChanged: types !== changedTypes,
        consumerErrorsBefore: compileConsumer(types, consumer).length,
        consumerErrorsAfter: compileConsumer(changedTypes, consumer).length,
        runtime: {
          nullWorkphaseAccepted: changed.requestValid('item', { workphaseId: null }),
          wrongOptionalFieldAccepted: changed.requestValid('item', { workphaseId: null, clientNote: 7 }),
        },
      });
    }
    const negativeInputs = [{}, { workphaseId: null, position: 7 }, { anchorId: 'neighbor', side: 'sideways' }].map(
      body => ({
        body,
        compilerRejects:
          compileConsumer(
            types,
            `import type { components } from './generated';
        export const body: components['schemas']['ItemMove'] = ${JSON.stringify(body)};`,
          ).length > 0,
        runtimeRejects: !candidate.requestValid('item', body),
        generatedSchemaRejects: !documentValidator(document, 'ItemMove')(body),
      }),
    );
    candidates.push({
      name: candidate.name,
      endpointCount: Object.keys(document.paths).length,
      schemaCount: Object.keys(document.components.schemas).length,
      componentReferences: (JSON.stringify(document).match(/"\$ref"/g) ?? []).length,
      generatedTypeCharacters: types.length,
      representativeConsumerErrors: compileConsumer(types, basicConsumer).length,
      negativeInputs,
      changes,
      baselineStillAcceptsNullWorkphase: create().requestValid('item', { workphaseId: null }),
    });
  }
  return {
    versions: { ...manifest.devDependencies, consumerTypeScript: consumerCompilerVersion },
    nonblankSourceLines: sourceLines,
    candidates,
  };
}
