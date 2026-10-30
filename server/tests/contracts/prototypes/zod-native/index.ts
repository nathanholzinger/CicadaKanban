import * as z from 'zod';
import { assembleDocument, moves, type Candidate, type Change, type JsonSchema } from '../model.js';
import { zodShapes } from '../zod-shapes.js';

export function createNativeCandidate(change: Change = 'baseline'): Candidate {
  const { fields, schemas } = zodShapes(change);
  return {
    name: 'zod-native',
    fieldValid: (field, value) => fields[field].safeParse(value).success,
    requestValid: (resource, value) =>
      schemas[resource === 'item' ? 'ItemMove' : 'ProjectMove'].safeParse(value).success,
    responseValid: (resource, value) =>
      schemas[resource === 'error' ? 'Error' : resource === 'item' ? 'ItemWrite' : 'ProjectWrite'].safeParse(value)
        .success,
    document: () => {
      const registry = z.registry<{ id: string }>();
      for (const [name, schema] of Object.entries(schemas)) registry.add(schema, { id: name });
      const options = { uri: (id: string) => `#/components/schemas/${id}` };
      const input = z.toJSONSchema(registry, { ...options, io: 'input' });
      const output = z.toJSONSchema(registry, { ...options, io: 'output' });
      const inputs = new Set<string>(moves.map(move => move.input));
      const converted: Record<string, JsonSchema> = Object.fromEntries(
        Object.keys(schemas).map(name => {
          const { $schema: dialect, $id: id, ...json } = (inputs.has(name) ? input : output).schemas[name];
          void dialect;
          void id;
          return [name, { ...json }];
        }),
      );
      return assembleDocument(converted);
    },
  };
}
