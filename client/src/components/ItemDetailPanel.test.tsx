import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ItemDetail } from '../types';
import { makeItem } from '../test/itemFixture';
import { createItem, fetchItem, updateItem } from '../api/items';
import ItemDetailPanel from './ItemDetailPanel';

vi.mock('../api/items', () => ({ fetchItem: vi.fn(), updateItem: vi.fn(), createItem: vi.fn(), deleteItem: vi.fn() }));
vi.mock('../api/labels', () => ({
  fetchLabels: vi.fn().mockResolvedValue([]),
  fetchItemLabels: vi.fn().mockResolvedValue([]),
  addLabelToItem: vi.fn(),
  removeLabelFromItem: vi.fn(),
  createLabel: vi.fn(),
}));
vi.mock('../api/attachments', () => ({
  fetchAttachments: vi.fn().mockResolvedValue([]),
  createAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));
vi.mock('../api/agents', () => ({
  fetchAgents: vi.fn().mockResolvedValue([
    {
      id: 'agent-1',
      name: 'Scribe',
      notes: null,
      claudeProjectId: 'cp-1',
      surface: 'chat',
      repoPath: null,
      createdAt: 0,
      updatedAt: 0,
    },
  ]),
}));

// X, open in the panel, with one attached child and a candidate parent P.
const detail: ItemDetail = { ...makeItem('X'), children: [makeItem('C', { parentId: 'X' })], activity: [] };
const boardItems = [makeItem('X'), makeItem('P'), makeItem('C', { parentId: 'X' })];

// What a write answers when a reindex fired: the written row and the pairs.
const reindexed = [
  { id: 'X', position: 1 },
  { id: 'Y', position: 2 },
];

function openPanel() {
  const onUpdate = vi.fn();
  const onChildCreated = vi.fn();
  vi.mocked(fetchItem).mockResolvedValue(detail);
  render(
    <ItemDetailPanel
      itemId="X"
      items={boardItems}
      itemTypes={[]}
      onClose={() => {}}
      onUpdate={onUpdate}
      onDelete={() => {}}
      onNavigate={() => {}}
      onChildCreated={onChildCreated}
    />,
  );
  return { onUpdate, onChildCreated };
}

beforeEach(() => {
  vi.mocked(updateItem).mockReset();
  vi.mocked(createItem).mockReset();
});

// The disclosure reaches the board only if nothing on the way copies the row
// without its `reindexed` pairs, so each write path must hand on the whole response.
describe("the Sheet hands a write's whole response to the board", () => {
  it('from the parent picker', async () => {
    const response = { ...makeItem('X', { parentId: 'P' }), reindexed };
    vi.mocked(updateItem).mockResolvedValue(response);
    const { onUpdate } = openPanel();

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Parent item' }), 'P');

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(response));
  });

  it('from the agent picker', async () => {
    const response = { ...makeItem('X', { agentId: 'agent-1', assigneeType: 'agent' }), reindexed };
    vi.mocked(updateItem).mockResolvedValue(response);
    const { onUpdate } = openPanel();

    const agentPicker = (await screen.findByRole('option', { name: /Scribe/ })).closest('select')!;
    await userEvent.selectOptions(agentPicker, 'agent-1');

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(response));
  });

  it("from a child's attach toggle", async () => {
    const response = { ...makeItem('C', { parentId: 'X', isAttached: 0 }), reindexed };
    vi.mocked(updateItem).mockResolvedValue(response);
    const { onUpdate } = openPanel();

    await userEvent.click(await screen.findByRole('button', { name: 'Attached' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(response));
  });

  it('from creating a child', async () => {
    const response = { ...makeItem('N', { parentId: 'X' }), reindexed };
    vi.mocked(createItem).mockResolvedValue(response);
    const { onChildCreated } = openPanel();

    const children = (await screen.findByText(/^Children/)).parentElement!;
    await userEvent.click(within(children).getByRole('button', { name: '+ Add' }));
    await userEvent.type(screen.getByPlaceholderText('Child title...'), 'New child');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onChildCreated).toHaveBeenCalledWith(response));
  });
});
