// API shapes come from the server contract. UI rows allow unloaded detail fields;
// request aliases expose only the placement fields used by this client.

import type { components } from './generated';

type Schemas = components['schemas'];
type UiItem = Omit<Schemas['Item'], 'positionScope'> &
  Partial<Pick<Schemas['Item'], 'positionScope'>> &
  Partial<Pick<Schemas['ItemDetail'], 'depth'>>;

export type ItemWriteResponse = UiItem & Pick<Schemas['ItemWrite'], 'reindexed'>;
export type ItemDetailResponse = UiItem &
  Pick<Schemas['ItemDetail'], 'activity'> &
  Partial<Pick<Schemas['ItemDetail'], 'workflowId'>> & { children: UiItem[] };
export type MoveItemInput = Pick<Schemas['ItemMoveFields'], 'parentId' | 'isAttached'> & {
  workphaseId?: NonNullable<Schemas['ItemMoveFields']['workphaseId']>;
  anchorId?: Schemas['Id'];
  side?: Schemas['Side'];
};
export type ProjectWriteResponse = Schemas['ProjectWrite'];
export type MoveProjectInput = Pick<Schemas['ProjectMoveFields'], 'parentId' | 'prevId' | 'nextId'>;
export type WorkflowListResponse = Schemas['WorkflowList'];
