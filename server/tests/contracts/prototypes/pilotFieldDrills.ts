// Runs reversible source edits through fresh generation and real HTTP handlers. This is an
// explicit maintenance experiment, not a unit-test hook; all touched files are restored in finally.

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compileConsumer, basicConsumer, optionalFieldConsumer, responseFieldConsumer } from './typeChecks.js';

const server = fileURLToPath(new URL('../../../', import.meta.url));
const source = new URL('../../../src/schemas/items.ts', import.meta.url);
const generated = new URL('../../../../client/src/api/generated.ts', import.meta.url);
const temporary = new URL('./.pilot-field-drill.test.ts', import.meta.url);
const files = [source, generated, new URL('../../../contracts/pilot.openapi.json', import.meta.url)];
const saved = await Promise.all(files.map(async file => [file, await readFile(file, 'utf8')] as const));
const original = saved[0][1];
const baselineTypes = saved[1][1];
const report: Record<string, unknown> = {};

function run(script: string, args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: server,
    encoding: 'utf8',
    timeout: 180000,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

async function regenerate(changed: string) {
  if (changed === original) throw new Error('Field edit did not match its source');
  await writeFile(source, changed);
  const result = run(fileURLToPath(new URL('../../../node_modules/tsx/dist/cli.mjs', import.meta.url)), [
    fileURLToPath(new URL('./generatePilot.ts', import.meta.url)),
  ]);
  if (result.status !== 0) throw new Error(result.output);
  return readFile(generated, 'utf8');
}

function test(path: string, args: string[] = []) {
  return run(fileURLToPath(new URL('../../../node_modules/vitest/vitest.mjs', import.meta.url)), [
    'run',
    path,
    ...args,
  ]);
}

const imports = `import { expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { itemDetailSchema } from '../../../src/schemas/items.js';
import { createCompatibilityFixture } from '../compatibilityHarness.js';\n`;
const missingResponseConsumer = `import type { components } from './generated';
type Row = components['schemas']['ItemWrite'];
declare const existing: Omit<Row, 'contractNote'>;
export const row: Row = existing;`;

try {
  const optionalTypes = await regenerate(
    original.replace(
      'scopeWorkphaseIds: z.unknown().optional(),',
      'scopeWorkphaseIds: z.unknown().optional(),\n  clientNote: z.string().optional(),',
    ),
  );
  await writeFile(
    temporary,
    imports +
      `it('a new optional request field reaches real parsing', async () => {
    const { ids } = await createCompatibilityFixture();
    await request(app).patch('/api/items/' + ids.movingItem + '/move')
      .send({workphaseId: ids.todo, clientNote: 'note'}).expect(200);
    await request(app).patch('/api/items/' + ids.movingItem + '/move')
      .send({workphaseId: ids.todo, clientNote: 7}).expect(400);
  });`,
  );
  const optional = test(fileURLToPath(temporary));
  report.optionalRequest = {
    authoredShapeEdits: 1,
    oldDiagnostics: compileConsumer(baselineTypes, optionalFieldConsumer),
    newDiagnostics: compileConsumer(optionalTypes, optionalFieldConsumer),
    runtimeStatus: optional.status,
  };
  if (optional.status !== 0 || compileConsumer(optionalTypes, optionalFieldConsumer).length)
    throw new Error(optional.output);

  const responseTypes = await regenerate(
    original.replace('title: z.string(),', 'title: z.string(),\n  contractNote: z.string(),'),
  );
  await writeFile(
    temporary,
    imports +
      `it('an unchanged response meets its contract', async () => {
    const { ids } = await createCompatibilityFixture();
    const response = await request(app).get('/api/items/' + ids.movingItem).expect(200);
    itemDetailSchema.parse(response.body);
  });`,
  );
  const response = test(fileURLToPath(temporary));
  report.requiredResponse = {
    authoredShapeEdits: 1,
    newFieldDiagnostics: compileConsumer(responseTypes, responseFieldConsumer),
    oldFixtureDiagnostics: compileConsumer(baselineTypes, missingResponseConsumer),
    newFixtureDiagnostics: compileConsumer(responseTypes, missingResponseConsumer),
    runtimeStatus: response.status,
    missingFieldReported: response.output.includes('contractNote'),
  };
  if (
    response.status === 0 ||
    !response.output.includes('contractNote') ||
    !compileConsumer(responseTypes, missingResponseConsumer).length
  )
    throw new Error('Required response drift went undetected');

  const nonNullTypes = await regenerate(
    original.replace('workphaseId: optionalReferenceSchema,', 'workphaseId: z.string().optional(),'),
  );
  const nonNull = test('tests/contracts/apiCompatibility.test.ts', ['-t', 'ATT-9.11']);
  report.nullability = {
    authoredShapeEdits: 1,
    oldDiagnostics: compileConsumer(baselineTypes, basicConsumer),
    newDiagnostics: compileConsumer(nonNullTypes, basicConsumer),
    unchangedCompatibilityStatus: nonNull.status,
    expected200Received400: /expected 400 to be 200/.test(nonNull.output),
  };
  if (nonNull.status === 0 || !compileConsumer(nonNullTypes, basicConsumer).length)
    throw new Error('Nullability drift went undetected');
} finally {
  for (const [file, content] of saved) await writeFile(file, content);
  await unlink(temporary).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
}
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
