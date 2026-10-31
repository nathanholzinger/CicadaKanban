// Probes native conversion boundaries and generated-type limits independently of HTTP
// behavior tests. A passing conversion is not proof that a business rule is correct.

import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { version as applicationCompilerVersion } from 'typescript';
import { Ajv2020, generateTypes, documentValidator } from '../../../tools/api-contracts/document.js';
import { basicConsumer, compileConsumer, consumerCompilerVersion } from '../../../tools/api-contracts/appCompiler.js';
import { contractSchemas, createContractDocument } from '../../src/schemas/openapi.js';

describe('native conversion boundaries', () => {
  it('distinguishes defaulted input from output', () => {
    const schema = z.object({ value: z.string().default('fallback') });
    expect(z.toJSONSchema(schema, { io: 'input' }).required).toBeUndefined();
    expect(z.toJSONSchema(schema, { io: 'output' }).required).toEqual(['value']);
  });

  it('coercion requires an explicit wire-representation check', () => {
    const schema = z.coerce.number();
    const ajv = new Ajv2020({ strict: false });
    expect(schema.safeParse('7').success).toBe(true);
    expect(z.toJSONSchema(schema, { io: 'input' }).type).toBe('number');
    expect(z.toJSONSchema(schema, { io: 'output' }).type).toBe('number');
    expect(ajv.compile(z.toJSONSchema(schema, { io: 'input' }))('7')).toBe(false);
  });

  it('unrepresentable transforms fail generation rather than silently widening output', () => {
    expect(() => z.toJSONSchema(z.string().transform(value => value.length))).toThrow();
  });

  it('custom refinements need independent representation checks', () => {
    const schema = z.string().refine(value => value.startsWith('allowed'));
    expect(schema.safeParse('wrong').success).toBe(false);
    expect(new Ajv2020({ strict: false }).compile(z.toJSONSchema(schema))('wrong')).toBe(true);
  });

  it('Ajv defaults and coercion are opt-in changes to input', () => {
    const schema = { type: 'object', properties: { value: { type: 'number', default: 7 } }, required: ['value'] };
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

  it('validation preserves unknown fields and input values', () => {
    const value = { workphaseId: null, side: 'ignored', surprise: { kept: true } };
    const before = structuredClone(value);
    expect(contractSchemas.ItemMove.safeParse(value).success).toBe(true);
    expect(value).toEqual(before);
    expect(contractSchemas.ItemMove.safeParse({ workphaseId: 7 }).success).toBe(false);
    expect(documentValidator(createContractDocument(), 'ItemMove')(value)).toBe(true);
    expect(value).toEqual(before);
  });

  it('generated declarations compile existing callers but miss some conditional refusals', async () => {
    expect(consumerCompilerVersion).toBe(applicationCompilerVersion);
    const document = createContractDocument();
    const generated = await generateTypes(document);
    expect(compileConsumer(generated, basicConsumer)).toEqual([]);
    const payloads = [{}, { workphaseId: null, position: 7 }, { anchorId: 'neighbor', side: 'sideways' }];
    for (const [index, payload] of payloads.entries()) {
      const source = `import type { components } from './generated';
        export const body: components['schemas']['ItemMove'] = ${JSON.stringify(payload)};`;
      expect(compileConsumer(generated, source).length > 0).toBe(index === 0);
      expect(contractSchemas.ItemMove.safeParse(payload).success).toBe(false);
      expect(documentValidator(document, 'ItemMove')(payload)).toBe(false);
    }
  });
});
