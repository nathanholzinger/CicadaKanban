// Exercises conversion boundaries that the selected endpoints do not all use: defaults, coercion,
// custom refinements, request conditions, and the difference between schema and TypeScript enforcement.

import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { createSchema, createDocument } from 'zod-openapi';
import Ajv2020 from 'ajv/dist/2020.js';
import Type from 'typebox';
import { candidateFactories } from './candidates.js';
import { generateTypes, documentValidator } from './documents.js';
import { compileConsumer } from './typeChecks.js';

describe('conversion boundaries', () => {
  it('native and library conversion distinguish defaulted input from output', () => {
    const schema = z.object({ value: z.string().default('fallback') });
    expect(z.toJSONSchema(schema, { io: 'input' }).required).toBeUndefined();
    expect(z.toJSONSchema(schema, { io: 'output' }).required).toEqual(['value']);
    expect(createSchema(schema, { io: 'input' }).schema).not.toHaveProperty('required');
    expect(createSchema(schema, { io: 'output' }).schema).toHaveProperty('required', ['value']);
  });

  it('coercion requires an explicit input-representation check in both Zod approaches', () => {
    const schema = z.coerce.number();
    const ajv = new Ajv2020({ strict: false });
    expect(schema.safeParse('7').success).toBe(true);
    expect(z.toJSONSchema(schema, { io: 'input' }).type).toBe('number');
    expect(z.toJSONSchema(schema, { io: 'output' }).type).toBe('number');
    expect(createSchema(schema, { io: 'input' }).schema).toHaveProperty('type', 'number');
    expect(createSchema(schema, { io: 'output' }).schema).toHaveProperty('type', 'number');
    expect(ajv.compile(z.toJSONSchema(schema, { io: 'input' }))('7')).toBe(false);
    expect(ajv.compile(createSchema(schema, { io: 'input' }).schema)('7')).toBe(false);
  });

  it('unrepresentable transforms fail generation instead of becoming an unconstrained output', () => {
    const schema = z.string().transform(value => value.length);
    expect(() => z.toJSONSchema(schema)).toThrow();
    expect(() => createSchema(schema)).toThrow();
  });

  it('custom refinements need explicit representation checks in both Zod approaches', () => {
    const schema = z.string().refine(value => value.startsWith('allowed'));
    const ajv = new Ajv2020({ strict: false });
    expect(schema.safeParse('wrong').success).toBe(false);
    expect(ajv.compile(z.toJSONSchema(schema))('wrong')).toBe(true);
    expect(ajv.compile(createSchema(schema).schema)('wrong')).toBe(true);
  });

  it('Ajv defaults and coercion are opt-in changes to input', () => {
    const schema = Type.Object({ value: Type.Number({ default: 7 }) });
    const missing: Record<string, unknown> = {};
    const stringValue = { value: '7' };
    const pure = new Ajv2020({ useDefaults: false, coerceTypes: false });
    expect(pure.compile(schema)(missing)).toBe(false);
    expect(pure.compile(schema)(stringValue)).toBe(false);
    expect(missing).toEqual({});
    expect(stringValue).toEqual({ value: '7' });
    const changing = new Ajv2020({ useDefaults: true, coerceTypes: true });
    expect(changing.compile(schema)(missing)).toBe(true);
    expect(changing.compile(schema)(stringValue)).toBe(true);
    expect(missing).toEqual({ value: 7 });
    expect(stringValue).toEqual({ value: 7 });
  });

  it('the OpenAPI library assembles path and query parameters from object schemas', () => {
    const document = createDocument({
      openapi: '3.1.0',
      info: { title: 'Parameter probe', version: '0' },
      paths: {
        '/probe/{id}': {
          get: {
            requestParams: {
              path: z.object({ id: z.string() }),
              query: z.object({ limit: z.number().int().optional() }),
            },
            responses: { 204: { description: 'No content' } },
          },
        },
      },
    });
    expect(document.paths?.['/probe/{id}']?.get?.parameters).toEqual([
      { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
      {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER },
      },
    ]);
  });

  for (const create of candidateFactories) {
    it(`${create().name} validation leaves unknown fields and input values unchanged`, () => {
      const candidate = create();
      const value = { workphaseId: null, side: 'ignored', surprise: { kept: true } };
      const before = structuredClone(value);
      expect(candidate.requestValid('item', value)).toBe(true);
      expect(value).toEqual(before);
      expect(candidate.requestValid('item', { workphaseId: 7 })).toBe(false);
    });

    it(`${create().name} generated types have documented enforcement limits`, async () => {
      const candidate = create();
      const generated = await generateTypes(candidate.document());
      const payloads = [{}, { workphaseId: null, position: 7 }, { anchorId: 'neighbor', side: 'sideways' }];
      for (const [index, payload] of payloads.entries()) {
        const source = `import type { components } from './generated';
          export const body: components['schemas']['ItemMove'] = ${JSON.stringify(payload)};`;
        expect(compileConsumer(generated, source).length > 0).toBe(index === 0 && candidate.name !== 'typebox-ajv');
        expect(candidate.requestValid('item', payload)).toBe(false);
        expect(documentValidator(candidate.document(), 'ItemMove')(payload)).toBe(false);
      }
    });
  }
});
