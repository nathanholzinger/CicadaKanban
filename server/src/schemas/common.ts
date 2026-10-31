// Shared wire primitives. Storage rows remain Drizzle-owned; these definitions describe
// serialized API values, including numeric flags and the error envelope.

import * as z from 'zod';
import { positionScopes, sides } from '../domain/positioning.js';

export const idSchema = z.string();
export const optionalReferenceSchema = idSchema.nullable().optional();
export const timestampSchema = z.number().int();
export const positionScopeSchema = z.enum(positionScopes);
export const sideSchema = z.enum(sides);
export const reindexedPositionSchema = z.strictObject({ id: idSchema, position: z.number() });
export const errorSchema = z.strictObject({ error: z.string() });
export const idParamsSchema = z.object({ id: idSchema });
export const forbiddenPositionSchema = z.never().optional();

export function schemaErrorMessage(error: z.ZodError): string {
  return error.issues.map(issue => issue.message).join('; ');
}
