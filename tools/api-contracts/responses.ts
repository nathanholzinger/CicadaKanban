// Test-only response validation selected from the emitted method/path/status association.
// Expected statuses and business effects remain independently asserted by callers.

import type { ValidateFunction } from 'ajv';
import { documentValidator, type ContractDocument } from './document.js';

type DocumentOperation = {
  responses: Record<string, { content?: { 'application/json'?: { schema: { $ref: string } } } }>;
};
export type ObservedResponse = {
  method: string;
  path: string;
  status: number;
  body: unknown;
  text?: string;
};

export function responseAssertion(document: ContractDocument) {
  const validators = new Map<string, ValidateFunction>();
  return (observed: ObservedResponse): string | undefined => {
    const path = observed.path.split('?')[0].replace(/\/$/, '');
    const method = observed.method.toLowerCase();
    const entries = Object.entries(document.paths);
    const exact = entries.find(([template]) => template === path);
    const matches = exact
      ? [exact]
      : entries.filter(([template]) => {
          const parts = template.split('/');
          const actual = path.split('/');
          return (
            parts.length === actual.length &&
            parts.every((part, i) => (/^\{[^}]+\}$/.test(part) ? actual[i].length > 0 : part === actual[i]))
          );
        });
    if (matches.length !== 1) throw new Error(`Missing or ambiguous response operation: ${method} ${path}`);
    const [template, methods] = matches[0];
    const operation = (methods as Record<string, DocumentOperation>)[method];
    const key = `${method} ${template} ${observed.status}`;
    if (!operation) throw new Error(`Missing response operation: ${key}`);
    const response = operation.responses[String(observed.status)];
    if (!response) throw new Error(`Undocumented response status: ${key}`);
    if (!response.content) {
      if (observed.text !== '') throw new Error(`Expected empty response body: ${key}`);
      return undefined;
    }
    const schema = response.content['application/json']?.schema;
    if (!schema || !schema.$ref.startsWith('#/components/schemas/'))
      throw new Error(`Unsupported response schema: ${key}`);
    const name = schema.$ref.slice('#/components/schemas/'.length);
    if (!Object.hasOwn(document.components.schemas, name)) throw new Error(`Unknown response schema: ${key} ${name}`);
    let validate = validators.get(schema.$ref);
    if (!validate) {
      validate = documentValidator(document, name);
      validators.set(schema.$ref, validate);
    }
    if (!validate(observed.body))
      throw new Error(`Response mismatch: ${key} ${name}: ${JSON.stringify(validate.errors)}`);
    return name;
  };
}
