// Project move transport and response contracts. Array bodies retain their empty-move
// semantics; neighbor selection and legal-parent checks remain domain behavior.

import * as z from 'zod';
import {
  forbiddenPositionSchema,
  idSchema,
  optionalReferenceSchema,
  reindexedPositionSchema,
  timestampSchema,
  schemaErrorMessage,
} from './common.js';

export const projectMoveFieldsSchema = z.looseObject({
  parentId: optionalReferenceSchema,
  prevId: optionalReferenceSchema,
  nextId: optionalReferenceSchema,
  position: forbiddenPositionSchema,
});
export const projectMoveSchema = z.union([projectMoveFieldsSchema, z.array(z.unknown())]);

export function parseProjectMove(input: unknown) {
  const { position } = input as Record<string, unknown>;
  if (!forbiddenPositionSchema.safeParse(position).success) {
    return { error: 'position is not accepted: name a prevId or nextId to place the project instead' };
  }
  const normalized = Array.isArray(input) ? {} : input;
  const result = projectMoveFieldsSchema.safeParse(normalized);
  if (!result.success) {
    for (const field of ['prevId', 'nextId', 'parentId'] as const) {
      if (result.error.issues.some(issue => issue.path[0] === field))
        return { error: `${field} must be a string or null` };
    }
    return { error: schemaErrorMessage(result.error) };
  }
  return { data: result.data };
}

export const projectSchema = z.strictObject({
  id: idSchema,
  parentId: idSchema.nullable(),
  name: z.string(),
  description: z.string().nullable(),
  position: z.number().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export const projectWriteSchema = projectSchema.extend({ reindexed: z.array(reindexedPositionSchema).optional() });
