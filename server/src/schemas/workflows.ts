// Workflow collection wire contracts. Query values are described before the handler's
// existing truthiness/String conversion, so repeated query keys retain their behavior.

import * as z from 'zod';
import { idSchema, timestampSchema } from './common.js';

export const workflowProjectFilterSchema = z.union([z.string(), z.array(z.string())]);
export const workflowQuerySchema = z.looseObject({ projectId: workflowProjectFilterSchema.optional() });
export const workflowSchema = z.strictObject({
  id: idSchema,
  projectId: idSchema.nullable(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export const workflowListSchema = z.array(workflowSchema);
