import * as z from 'zod';
import { createDocument } from 'zod-openapi';
import { info, moves, type Candidate, type Change, type Document } from '../model.js';
import { zodShapes } from '../zod-shapes.js';

export function createLibraryCandidate(change: Change = 'baseline'): Candidate {
  const { fields, schemas } = zodShapes(change);
  return {
    name: 'zod-library',
    fieldValid: (field, value) => fields[field].safeParse(value).success,
    requestValid: (resource, value) =>
      schemas[resource === 'item' ? 'ItemMove' : 'ProjectMove'].safeParse(value).success,
    responseValid: (resource, value) =>
      schemas[resource === 'error' ? 'Error' : resource === 'item' ? 'ItemWrite' : 'ProjectWrite'].safeParse(value)
        .success,
    document: () => {
      const response = (schema: z.ZodType, description: string) => ({
        description,
        content: { 'application/json': { schema } },
      });
      const result = createDocument({
        openapi: '3.1.0',
        info,
        components: { schemas },
        paths: Object.fromEntries(
          moves.map(move => [
            move.path,
            {
              patch: {
                operationId: move.operationId,
                requestParams: { path: z.object({ id: schemas.Id }) },
                requestBody: { required: true, content: { 'application/json': { schema: schemas[move.input] } } },
                responses: {
                  200: response(schemas[move.output], 'Stored row with optional reindex disclosure'),
                  400: response(schemas.Error, 'Existing validation or domain refusal'),
                  404: response(schemas.Error, 'Target not found before handler validation'),
                  500: response(schemas.Error, 'Existing global error-handler response'),
                },
              },
            },
          ]),
        ),
      });
      return result as Document;
    },
  };
}
