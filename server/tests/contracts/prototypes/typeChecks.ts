// Compile generated types with a small handwritten consumer in a virtual filesystem. Diagnostic
// differences measure whether contract edits reach consumers without altering application files.

import type * as TypeScript from 'typescript';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The generator has its own compiler peer; consumers must be checked with the application's compiler.
const projectRequire = createRequire(new URL('../../../package.json', import.meta.url));
const ts: typeof TypeScript = projectRequire('typescript');
export const consumerCompilerVersion = ts.version;

export function compileConsumer(generated: string, consumer: string): string[] {
  const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'virtual');
  const generatedPath = path.join(directory, 'generated.d.ts');
  const consumerPath = path.join(directory, 'consumer.ts');
  const files = new Map([
    [generatedPath, generated],
    [consumerPath, consumer],
  ]);
  const options: TypeScript.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  const exists = host.fileExists.bind(host);
  const directoryExists = host.directoryExists?.bind(host);
  const normalized = (file: string) => path.normalize(file);
  host.readFile = file => files.get(normalized(file)) ?? read(file);
  host.fileExists = file => files.has(normalized(file)) || exists(file);
  host.directoryExists = dir => normalized(dir) === directory || Boolean(directoryExists?.(dir));
  const program = ts.createProgram([consumerPath], options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map(d => `${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}

export const basicConsumer = `
import type { components, operations } from './generated';
type Request = operations['moveItem']['requestBody']['content']['application/json'];
declare function move(body: Request): Promise<components['schemas']['ItemWrite']>;
export const result = move({workphaseId: null, anchorId: 'neighbor', side: 'after'});
export const scope = (row: components['schemas']['ItemWrite']): components['schemas']['PositionScope'] => row.positionScope;
export const project = (body: operations['moveProject']['requestBody']['content']['application/json']) => body;
`;

export const optionalFieldConsumer = `
import type { components } from './generated';
declare const body: components['schemas']['ItemMove'];
export const note: string | undefined = body.clientNote;
`;

export const responseFieldConsumer = `
import type { components } from './generated';
declare const row: components['schemas']['ItemWrite'];
export const note: string = row.contractNote;
`;

export function fixtureConsumer(response: unknown): string {
  return `import type { components } from './generated';
    export const row: components['schemas']['ItemWrite'] = ${JSON.stringify(response)};`;
}
