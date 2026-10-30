import Type from 'typebox';
import Ajv2020 from 'ajv/dist/2020.js';
import { assembleDocument, decorateItemRequest, type Candidate, type Change, type Field } from '../model.js';

export function createTypeboxCandidate(change: Change = 'baseline'): Candidate {
  const optionalString = Type.Optional(Type.Union([Type.String(), Type.Null()]));
  const fields = {
    position: Type.Optional(Type.Never()),
    parentId: optionalString,
    isAttached: Type.Optional(Type.Boolean()),
    workphaseId: change === 'workphase-not-null' ? Type.Optional(Type.String()) : optionalString,
    prevId: optionalString,
    nextId: optionalString,
    side: Type.Enum(['before', 'after']),
  };
  const id = Type.String();
  const nullableString = Type.Union([Type.String(), Type.Null()]);
  const timestamp = Type.Integer();
  const position = Type.Union([Type.Number(), Type.Null()]);
  const scope = Type.Enum(['attached-siblings', 'workflow', 'none']);
  const pair = Type.Object({ id, position: Type.Number() }, { additionalProperties: false });
  const itemObject = Type.Object(
    {
      position: fields.position,
      parentId: fields.parentId,
      isAttached: fields.isAttached,
      workphaseId: fields.workphaseId,
      anchorId: Type.Optional(Type.Unknown()),
      side: Type.Optional(Type.Unknown()),
      scopeWorkphaseIds: Type.Optional(Type.Unknown()),
      ...(change === 'optional-request-field' ? { clientNote: Type.Optional(Type.String()) } : {}),
    },
    { additionalProperties: true },
  );
  const responseExtra: Type.TProperties = change === 'required-response-field' ? { contractNote: Type.String() } : {};
  const schemas = {
    Id: id,
    Side: fields.side,
    PositionScope: scope,
    ReindexedPosition: pair,
    ItemMove: decorateItemRequest({ ...itemObject }, { ...fields.side }),
    ProjectMove: Type.Union([
      Type.Object(
        { position: fields.position, parentId: fields.parentId, prevId: fields.prevId, nextId: fields.nextId },
        { additionalProperties: true },
      ),
      Type.Array(Type.Unknown()),
    ]),
    ItemWrite: Type.Object(
      {
        id,
        type: nullableString,
        parentId: nullableString,
        projectId: nullableString,
        workphaseId: nullableString,
        title: Type.String(),
        description: nullableString,
        position,
        isAttached: Type.Integer(),
        assigneeType: nullableString,
        agentId: nullableString,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: Type.Union([timestamp, Type.Null()]),
        positionScope: scope,
        reindexed: Type.Optional(Type.Array(pair)),
        ...responseExtra,
      },
      { additionalProperties: false },
    ),
    ProjectWrite: Type.Object(
      {
        id,
        parentId: nullableString,
        name: Type.String(),
        description: nullableString,
        position,
        createdAt: timestamp,
        updatedAt: timestamp,
        reindexed: Type.Optional(Type.Array(pair)),
        ...responseExtra,
      },
      { additionalProperties: false },
    ),
    Error: Type.Object({ error: Type.String() }, { additionalProperties: false }),
  };
  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
  });
  const fieldChecks = Object.fromEntries(Object.entries(fields).map(([name, schema]) => [name, ajv.compile(schema)]));
  const checks = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]));
  return {
    name: 'typebox-ajv',
    fieldValid: (field: Field, value) => (value === undefined && field !== 'side' ? true : fieldChecks[field](value)),
    requestValid: (resource, value) => checks[resource === 'item' ? 'ItemMove' : 'ProjectMove'](value),
    responseValid: (resource, value) =>
      checks[resource === 'error' ? 'Error' : resource === 'item' ? 'ItemWrite' : 'ProjectWrite'](value),
    document: () =>
      assembleDocument(Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, { ...schema }]))),
  };
}
