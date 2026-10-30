// Zod shape definitions shared by the library-backed and native-conversion candidates.
// Unknown legacy fields remain unknown; the domain validator establishes usable entity references.

import * as z from 'zod';
import { intentFields, type Change, type Field } from './model.js';

export function zodShapes(change: Change = 'baseline') {
  const fields = {
    position: z.never().optional(),
    parentId: z.string().nullable().optional(),
    isAttached: z.boolean().optional(),
    workphaseId: change === 'workphase-not-null' ? z.string().optional() : z.string().nullable().optional(),
    prevId: z.string().nullable().optional(),
    nextId: z.string().nullable().optional(),
    side: z.enum(['before', 'after']),
  } satisfies Record<Field, z.ZodType>;
  const itemObject = z.looseObject({
    position: fields.position,
    parentId: fields.parentId,
    isAttached: fields.isAttached,
    workphaseId: fields.workphaseId,
    anchorId: z.unknown().optional(),
    side: z.unknown().optional(),
    scopeWorkphaseIds: z.unknown().optional(),
    ...(change === 'optional-request-field' ? { clientNote: z.string().optional() } : {}),
  });
  const intent = z.union([
    ...intentFields.map(field => z.looseObject({ [field]: z.unknown() })),
    z.looseObject({ scopeWorkphaseIds: z.array(z.unknown()).min(1) }),
  ]);
  const anchorSide = z.union([
    z.looseObject({ anchorId: z.never().optional() }),
    z.looseObject({ anchorId: z.unknown(), side: fields.side }),
  ]);
  const itemMove = z.intersection(itemObject, z.intersection(intent, anchorSide));
  const projectMove = z.union([
    z.looseObject({
      position: fields.position,
      parentId: fields.parentId,
      prevId: fields.prevId,
      nextId: fields.nextId,
    }),
    z.array(z.unknown()),
  ]);
  const id = z.string();
  const nullableString = z.string().nullable();
  const timestamp = z.number().int();
  const position = z.number().nullable();
  const scope = z.enum(['attached-siblings', 'workflow', 'none']);
  const pair = z.strictObject({ id, position: z.number() });
  const responseExtra = change === 'required-response-field' ? { contractNote: z.string() } : {};
  const itemWrite = z.strictObject({
    id,
    type: nullableString,
    parentId: nullableString,
    projectId: nullableString,
    workphaseId: nullableString,
    title: z.string(),
    description: nullableString,
    position,
    isAttached: z.number().int(),
    assigneeType: nullableString,
    agentId: nullableString,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: timestamp.nullable(),
    positionScope: scope,
    reindexed: z.array(pair).optional(),
    ...responseExtra,
  });
  const projectWrite = z.strictObject({
    id,
    parentId: nullableString,
    name: z.string(),
    description: nullableString,
    position,
    createdAt: timestamp,
    updatedAt: timestamp,
    reindexed: z.array(pair).optional(),
    ...responseExtra,
  });
  return {
    fields,
    schemas: {
      Id: id,
      Side: fields.side,
      PositionScope: scope,
      ReindexedPosition: pair,
      ItemMove: itemMove,
      ProjectMove: projectMove,
      ItemWrite: itemWrite,
      ProjectWrite: projectWrite,
      Error: z.strictObject({ error: z.string() }),
    },
  };
}
