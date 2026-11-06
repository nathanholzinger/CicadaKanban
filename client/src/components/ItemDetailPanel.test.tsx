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

function openPanel(shown: ItemDetail = detail, itemDepthCap = 12) {
  const onUpdate = vi.fn();
  const onChildCreated = vi.fn();
  vi.mocked(fetchItem).mockResolvedValue(shown);
  render(
    <ItemDetailPanel
      itemId="X"
      items={boardItems}
      itemTypes={[]}
      itemDepthCap={itemDepthCap}
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
describe("TC-5a.1: the Sheet hands a write's whole response to the board", () => {
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

// The Sheet's add-child control stops at the item depth cap: the API's depth counts a root as 0,
// so an item at depth CAP - 1 is at the cap and takes no child.
describe('the Sheet’s add-child control at the depth cap', () => {
  const CAP = 5;
  const addChild = async () => {
    const children = (await screen.findByText(/^Children/)).parentElement!;
    return within(children).getByRole('button', { name: '+ Add' });
  };

  it('ATT-10.6: is offered for an item one level short of the cap', async () => {
    openPanel({ ...detail, depth: CAP - 2 }, CAP);

    const add = await addChild();
    expect(add).toBeEnabled();
    expect(add).not.toHaveAttribute('title');
  });

  it('ATT-10.7: shows disabled, saying why, for an item at the cap, and opens no form', async () => {
    openPanel({ ...detail, depth: CAP - 1 }, CAP);

    const add = await addChild();
    expect(add).toBeDisabled();
    expect(add).toHaveAttribute('title', `At the depth cap (${CAP} levels)`);
    await userEvent.click(add);
    expect(screen.queryByPlaceholderText('Child title...')).not.toBeInTheDocument();
  });

  // A write's answer carries no depth, so the Sheet reads the item again after a reparent.
  it('ATT-10.8: follows the item’s depth through a reparent up from the cap and back down to it, with the Sheet open', async () => {
    // T is one level short of the cap and S two, so X at the cap under T moves to CAP - 1 under S and back.
    const onUpdate = vi.fn();
    vi.mocked(fetchItem).mockResolvedValue({ ...detail, parentId: 'T', depth: CAP - 1 });
    render(
      <ItemDetailPanel
        itemId="X"
        items={[makeItem('X', { parentId: 'T' }), makeItem('S'), makeItem('T')]}
        itemTypes={[]}
        itemDepthCap={CAP}
        onClose={() => {}}
        onUpdate={onUpdate}
        onDelete={() => {}}
        onNavigate={() => {}}
        onChildCreated={() => {}}
      />,
    );
    const add = await addChild();
    expect(add).toBeDisabled();
    expect(add).toHaveAttribute('title', `At the depth cap (${CAP} levels)`);
    const parent = screen.getByRole('combobox', { name: 'Parent item' });

    // Under S the item is at CAP - 1: the control is enabled and starts a child create, which sends nothing yet.
    vi.mocked(updateItem).mockResolvedValue(makeItem('X', { parentId: 'S' }));
    vi.mocked(fetchItem).mockResolvedValue({ ...detail, parentId: 'S', depth: CAP - 2 });
    await userEvent.selectOptions(parent, 'S');
    await waitFor(() => expect(add).toBeEnabled());
    expect(add).not.toHaveAttribute('title');
    await userEvent.click(add);
    expect(screen.getByPlaceholderText('Child title...')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(createItem).not.toHaveBeenCalled();

    // Back under T it is at the cap again: disabled with the same reason, out of the tab order, and no create.
    vi.mocked(updateItem).mockResolvedValue(makeItem('X', { parentId: 'T' }));
    vi.mocked(fetchItem).mockResolvedValue({ ...detail, parentId: 'T', depth: CAP - 1 });
    await userEvent.selectOptions(parent, 'T');
    // The form's closing drew the control again.
    const again = await addChild();
    await waitFor(() => expect(again).toBeDisabled());
    expect(again).toHaveAttribute('title', `At the depth cap (${CAP} levels)`);
    again.focus();
    expect(again).not.toHaveFocus();
    await userEvent.click(again);
    expect(screen.queryByPlaceholderText('Child title...')).not.toBeInTheDocument();
    expect(createItem).not.toHaveBeenCalled();
  });

  it('reads the item again for a reparent only, not for another write to it', async () => {
    openPanel({ ...detail, parentId: 'P', isAttached: 1, depth: 1 }, CAP);
    const attached = await screen.findByRole('checkbox', { name: 'Attached' });
    vi.mocked(updateItem).mockResolvedValue(makeItem('X', { parentId: 'P', isAttached: 0 }));
    vi.mocked(fetchItem).mockClear();

    await userEvent.click(attached);

    await waitFor(() => expect(attached).not.toBeChecked());
    expect(fetchItem).not.toHaveBeenCalled();
  });
});
