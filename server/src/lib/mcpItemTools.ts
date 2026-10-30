// The existing item tools' advertised shapes share API primitives. Calls retain their raw
// argument mapping and result text; advertising a schema does not add runtime restrictions.

import * as z from 'zod';
import { idSchema } from '../schemas/common.js';
import { urlPart } from './urlPart.js';

export const mcpItemInputs = {
  get_item: z.looseObject({ item_id: idSchema.describe('The item ID') }),
  move_item: z.looseObject({
    item_id: idSchema.describe('The item ID'),
    workphase_id: idSchema.describe('Target workphase ID'),
  }),
};

export function mcpItemInputSchema(name: keyof typeof mcpItemInputs) {
  const { $schema, additionalProperties, ...schema } = z.toJSONSchema(mcpItemInputs[name], { io: 'input' });
  void $schema;
  void additionalProperties;
  return schema;
}

type ApiCaller = (path: string, options?: RequestInit) => Promise<unknown>;
export async function callMcpItemTool(
  name: keyof typeof mcpItemInputs,
  args: Record<string, unknown> | undefined,
  api: ApiCaller,
) {
  if (name === 'get_item') {
    const item = await api(`/items/${urlPart(args!.item_id)}`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(item, null, 2) }] };
  }
  await api(`/items/${urlPart(args!.item_id)}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ workphaseId: args!.workphase_id }),
  });
  return {
    content: [{ type: 'text' as const, text: `Moved item ${args!.item_id} to workphase ${args!.workphase_id}` }],
  };
}
