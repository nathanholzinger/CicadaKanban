import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API = 'http://localhost:3001/api';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const server = new Server(
  { name: 'kanban', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_boards',
      description: 'List all Kanban boards',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_board',
      description: 'Get a board with all its columns and cards',
      inputSchema: {
        type: 'object',
        properties: {
          board_id: { type: 'string', description: 'The board ID' },
        },
        required: ['board_id'],
      },
    },
    {
      name: 'get_card',
      description: 'Get full details of a card including description, children, and activity log',
      inputSchema: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'The card ID' },
        },
        required: ['card_id'],
      },
    },
    {
      name: 'create_card',
      description: 'Create a new card on the board',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Card title' },
          type: { type: 'string', description: 'Card type name (e.g. "Epic", "Story", "Task") or UUID. Optional — if omitted the card has no type.' },
          board_id: { type: 'string', description: 'Board to create the card on' },
          column_id: { type: 'string', description: 'Column to place the card in' },
          description: { type: 'string', description: 'Optional card description' },
          parent_id: { type: 'string', description: 'Optional parent card ID' },
        },
        required: ['title', 'board_id', 'column_id'],
      },
    },
    {
      name: 'update_card',
      description: 'Update a card\'s title and/or description',
      inputSchema: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'The card ID' },
          title: { type: 'string', description: 'New title' },
          description: { type: 'string', description: 'New description' },
        },
        required: ['card_id'],
      },
    },
    {
      name: 'move_card',
      description: 'Move a card to a different column',
      inputSchema: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'The card ID' },
          column_id: { type: 'string', description: 'Target column ID' },
        },
        required: ['card_id', 'column_id'],
      },
    },
    {
      name: 'add_comment',
      description: 'Add a comment or note to a card\'s activity log',
      inputSchema: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'The card ID' },
          content: { type: 'string', description: 'Comment text' },
        },
        required: ['card_id', 'content'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_boards': {
        const boards = await api('/boards');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(boards, null, 2),
          }],
        };
      }

      case 'get_board': {
        const board = await api(`/boards/${args!.board_id}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(board, null, 2),
          }],
        };
      }

      case 'get_card': {
        const card = await api(`/work-items/${args!.card_id}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(card, null, 2),
          }],
        };
      }

      case 'create_card': {
        let resolvedType: string | null = null;
        if (args!.type) {
          const itemTypes = await api('/item-types') as Array<{ id: string; name: string }>;
          const match = itemTypes.find(
            t => t.name.toLowerCase() === String(args!.type).toLowerCase() || t.id === args!.type
          );
          if (!match) throw new Error(`Unknown item type: "${args!.type}". Available: ${itemTypes.map(t => t.name).join(', ')}`);
          resolvedType = match.id;
        }
        const card = await api('/work-items', {
          method: 'POST',
          body: JSON.stringify({
            title: args!.title,
            type: resolvedType,
            boardId: args!.board_id,
            columnId: args!.column_id,
            description: args!.description,
            parentId: args!.parent_id,
          }),
        });
        return {
          content: [{
            type: 'text',
            text: `Created card: ${JSON.stringify(card, null, 2)}`,
          }],
        };
      }

      case 'update_card': {
        const updates: Record<string, unknown> = {};
        if (args!.title !== undefined) updates.title = args!.title;
        if (args!.description !== undefined) updates.description = args!.description;
        const card = await api(`/work-items/${args!.card_id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        return {
          content: [{
            type: 'text',
            text: `Updated card: ${JSON.stringify(card, null, 2)}`,
          }],
        };
      }

      case 'move_card': {
        // Get current board state to find target column's cards and calculate position
        const card = await api(`/work-items/${args!.card_id}`);
        const board = await api(`/boards/${card.boardId}`);
        const columnCards = (board.workItems as Array<{ columnId: string; position: number }>)
          .filter(i => i.columnId === args!.column_id);
        const position = columnCards.length > 0
          ? Math.max(...columnCards.map(i => i.position ?? 0)) + 1
          : 1;

        await api(`/work-items/${args!.card_id}/move`, {
          method: 'PATCH',
          body: JSON.stringify({ columnId: args!.column_id, position }),
        });
        return {
          content: [{
            type: 'text',
            text: `Moved card "${card.title}" to column ${args!.column_id}`,
          }],
        };
      }

      case 'add_comment': {
        await api(`/work-items/${args!.card_id}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: args!.content }),
        });
        return {
          content: [{
            type: 'text',
            text: `Comment added to card ${args!.card_id}`,
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${err instanceof Error ? err.message : String(err)}`,
      }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
