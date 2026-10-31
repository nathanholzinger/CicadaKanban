import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { positionScopes, sides } from '../../src/domain/positioning.js';
import { positionScopeSchema, sideSchema } from '../../src/schemas/common.js';
import type { Side } from '../../src/lib/positionResolver.js';
import type { PositionScope } from '../../src/lib/itemPositionScope.js';
import type { PositionScope as ClientPositionScope } from '../../../client/src/types.js';
import type { components } from '../../../client/src/api/generated.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const vocabularyAgreement: [Equal<Side, components['schemas']['Side']>, Equal<PositionScope, ClientPositionScope>] = [
  true,
  true,
];
const serverRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('database-free contract generation and vocabulary', () => {
  it('derives server schemas/domain types and client vocabulary from the same values', () => {
    expect(sideSchema.options).toEqual(sides);
    expect(positionScopeSchema.options).toEqual(positionScopes);
    expect(vocabularyAgreement).toEqual([true, true]);
  });

  it('keeps schemas and neutral domain modules within their import boundary', () => {
    for (const directory of ['schemas', 'domain']) {
      for (const file of readdirSync(path.join(serverRoot, 'src', directory), {
        recursive: true,
        encoding: 'utf8',
      }).filter(file => file.endsWith('.ts'))) {
        const filename = path.join(serverRoot, 'src', directory, file);
        const source = ts.createSourceFile(filename, readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
        const visit = (node: ts.Node) => {
          const specifier =
            ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
              ? node.moduleSpecifier
              : ts.isCallExpression(node) &&
                  (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                    node.expression.getText(source) === 'require')
                ? node.arguments[0]
                : undefined;
          if (specifier) {
            if (!ts.isStringLiteral(specifier)) throw new Error(`Non-literal contract import: ${filename}`);
            const name = specifier.text;
            if (name.startsWith('.')) {
              const relative = path
                .relative(path.join(serverRoot, 'src'), path.resolve(path.dirname(filename), name))
                .replaceAll('\\', '/');
              expect(relative, filename).toMatch(directory === 'domain' ? /^domain\// : /^(schemas|domain)\//);
            } else {
              if (directory === 'domain') throw new Error(`External dependency in neutral domain: ${filename} ${name}`);
              expect(name, filename).toBe('zod');
            }
          }
          ts.forEachChild(node, visit);
        };
        visit(source);
      }
    }
  });

  it('runs normal freshness in a subprocess that cannot open SQLite at DB_PATH', () => {
    const output = execFileSync(
      process.execPath,
      ['--import', 'tsx', '../tools/api-contracts/generate.ts', '--check'],
      {
        cwd: serverRoot,
        env: { ...process.env, DB_PATH: path.join(serverRoot, 'src', 'domain') },
        encoding: 'utf8',
        timeout: 20000,
      },
    );
    expect(output).toContain('openapi.json: current');
    expect(output).toContain('generated.ts: current');
  }, 25000);
});
