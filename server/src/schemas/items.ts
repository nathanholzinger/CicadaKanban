// Item request shapes, ordered compatibility errors, and serialized item/detail responses.
// Entity existence, hierarchy policy, positioning and writes remain in the hierarchy primitive.

import * as z from 'zod';
import {
  forbiddenPositionSchema,
  idSchema,
  optionalReferenceSchema,
  positionScopeSchema,
  reindexedPositionSchema,
  sideSchema,
  schemaErrorMessage,
  timestampSchema,
} from './common.js';

export const hierarchyFieldsSchema = z.looseObject({
  parentId: optionalReferenceSchema,
  isAttached: z.boolean().optional(),
  workphaseId: optionalReferenceSchema,
  anchorId: z.unknown().optional(),
  side: z.unknown().optional(),
});

export type HierarchyInput = z.output<typeof hierarchyFieldsSchema>;
export const itemMoveFieldsSchema = hierarchyFieldsSchema.extend({
  position: forbiddenPositionSchema,
  scopeWorkphaseIds: z.unknown().optional(),
});
const intentFields = ['workphaseId', 'anchorId', 'parentId', 'isAttached'] as const;
export const itemMoveIntentSchema = z.union([
  ...intentFields.map(field => z.looseObject({ [field]: z.unknown() })),
  z.looseObject({ scopeWorkphaseIds: z.array(z.unknown()).min(1) }),
]);
const anchorSideSchema = z.union([
  z.looseObject({ anchorId: z.never().optional() }),
  z.looseObject({ anchorId: z.unknown(), side: sideSchema }),
]);
export const itemMoveSchema = z.intersection(
  itemMoveFieldsSchema,
  z.intersection(itemMoveIntentSchema, anchorSideSchema),
);

export function parseHierarchyShape(input: unknown) {
  const result = hierarchyFieldsSchema.safeParse(input);
  if (!result.success) {
    for (const field of ['parentId', 'isAttached', 'workphaseId'] as const) {
      if (result.error.issues.some(issue => issue.path[0] === field)) {
        return { error: field === 'isAttached' ? 'isAttached must be a boolean' : `${field} must be a string or null` };
      }
    }
    throw result.error;
  }
  if (result.data.anchorId !== undefined && !sideSchema.safeParse(result.data.side).success) {
    return { error: "side must be 'before' or 'after' when anchorId is given" };
  }
  return { data: result.data };
}

export function parseItemMove(input: unknown) {
  // Destructuring preserves the missing-body exception after target lookup. JSON syntax and
  // primitive-body errors belong to Express's existing parser/error pipeline.
  const { position } = input as Record<string, unknown>;
  if (!forbiddenPositionSchema.safeParse(position).success) {
    return { error: 'position is not accepted: name an anchorId and side to place the item instead' };
  }
  if (!itemMoveIntentSchema.safeParse(input).success) {
    return { error: 'workphaseId, parentId, isAttached, and/or anchorId+side required' };
  }
  const hierarchy = parseHierarchyShape(input);
  if (hierarchy.error) return { error: hierarchy.error };
  const result = itemMoveSchema.safeParse(input);
  return result.success ? { data: result.data } : { error: schemaErrorMessage(result.error) };
}

export function hasExplicitItemIntent(input: HierarchyInput): boolean {
  return intentFields.some(field => input[field] !== undefined);
}

export const itemSchema = z.strictObject({
  id: idSchema,
  type: idSchema.nullable(),
  parentId: idSchema.nullable(),
  projectId: idSchema.nullable(),
  workphaseId: idSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number().nullable(),
  isAttached: z.number().int(),
  assigneeType: z.string().nullable(),
  agentId: idSchema.nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  completedAt: timestampSchema.nullable(),
  positionScope: positionScopeSchema,
});
export const itemWriteSchema = itemSchema.extend({ reindexed: z.array(reindexedPositionSchema).optional() });
export const activitySchema = z.strictObject({
  id: idSchema,
  itemId: idSchema,
  type: z.string(),
  content: z.string(),
  metadata: z.string().nullable(),
  createdAt: timestampSchema,
});
export const itemChildSchema = itemSchema.extend({ depth: z.number().int() });
export const itemDetailSchema = itemChildSchema.extend({
  workflowId: idSchema.nullable(),
  children: z.array(itemChildSchema),
  activity: z.array(activitySchema),
});
