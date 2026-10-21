// MCP server: tools wrapping the REST API (calls localhost:3001), used by external
// Claude agents.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { urlPart } from './lib/urlPart.js';

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

const server = new Server({ name: 'kanban', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_projects',
      description: 'List all projects (flat list; use parentId to reconstruct the hierarchy)',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'list_workflows',
      description: 'List all workflows, optionally filtered by project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Optional — filter to workflows belonging to this project' },
        },
        required: [],
      },
    },
    {
      name: 'get_workflow',
      description: 'Get a workflow with all its workphases and items',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'The workflow ID' },
        },
        required: ['workflow_id'],
      },
    },
    {
      name: 'get_item',
      description:
        'Get full details of an item including description, children, activity log, and which workflow it belongs to',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'The item ID' },
        },
        required: ['item_id'],
      },
    },
    {
      name: 'create_item',
      description: 'Create a new item, optionally placing it in a workflow workphase',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Item title' },
          project_id: {
            type: 'string',
            description:
              "Project this item belongs to. Optional if parent_id is given (the parent's project is inherited).",
          },
          workphase_id: {
            type: 'string',
            description:
              "Workphase to place the item in. Optional — omit to leave a top-level item unsorted. An attached child takes its parent's workphase, so omit this or name the parent's: any other is refused. A detached child (is_attached false) that omits it takes the workphase its parent is shown in; if that has none, the create is refused. A workphase of a workflow the project doesn't use is refused.",
          },
          type: { type: 'string', description: 'Item type name (e.g. "Epic", "Story", "Task") or UUID. Optional.' },
          description: { type: 'string', description: 'Optional item description' },
          parent_id: { type: 'string', description: 'Optional parent item ID' },
          is_attached: {
            type: 'boolean',
            description:
              "Whether this item moves with its parent between workphases. Only a child can be attached: with parent_id it defaults to true, and without parent_id true is refused. An attached child is placed in the parent's current workphase.",
          },
        },
        required: ['title'],
      },
    },
    {
      name: 'update_item',
      description:
        "Update an item's title, description, parent, and/or attach state. Reparenting or attaching an item that ends up attached to its parent moves it (and its own attached descendants) into the parent's current workphase. A reparent that omits is_attached keeps the item's state, so a top-level item becomes a detached child; pass is_attached true to attach it. Detaching an attached item, or making it top-level, leaves it in the workphase it was shown in; if the Free ancestor it is shown with has none, file that ancestor into a workphase first (move_item). A reparent into a project on a different workflow is refused when the moved subtree would hold a Free item (a detached item, or the item itself left detached): attach the item to its new parent, with no detached descendants, or reparent within its own workflow.",
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'The item ID' },
          title: { type: 'string', description: 'New title' },
          description: { type: 'string', description: 'New description' },
          parent_id: {
            type: 'string',
            description: 'New parent item ID, or null to make it top-level. Rejected if it would create a cycle.',
          },
          is_attached: {
            type: 'boolean',
            description:
              'Whether this item moves with its parent between workphases. Only a child can be attached: true on an item with no parent, and no parent_id in the same call, is refused.',
          },
        },
        required: ['item_id'],
      },
    },
    {
      name: 'move_item',
      description:
        "Move an item to a different workphase in its workflow. The workphase must belong to the workflow its project uses. An attached item takes its parent's workphase, so move its parent instead.",
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'The item ID' },
          workphase_id: { type: 'string', description: 'Target workphase ID' },
        },
        required: ['item_id', 'workphase_id'],
      },
    },
    {
      name: 'add_item_comment',
      description: "Add a comment or note to an item's activity log",
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'The item ID' },
          content: { type: 'string', description: 'Comment text' },
        },
        required: ['item_id', 'content'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_projects': {
        const projects = await api('/projects');
        return {
          content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
        };
      }

      case 'list_workflows': {
        const qs = args?.project_id ? `?projectId=${urlPart(args.project_id)}` : '';
        const workflows = await api(`/workflows${qs}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }],
        };
      }

      case 'get_workflow': {
        const workflow = await api(`/workflows/${urlPart(args!.workflow_id)}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }],
        };
      }

      case 'get_item': {
        const item = await api(`/items/${urlPart(args!.item_id)}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      case 'create_item': {
        let resolvedType: string | null = null;
        if (args!.type) {
          const itemTypes = (await api('/item-types')) as Array<{ id: string; name: string }>;
          const match = itemTypes.find(
            t => t.name.toLowerCase() === String(args!.type).toLowerCase() || t.id === args!.type,
          );
          if (!match) {
            const availableNames = itemTypes.map(t => t.name).join(', ');
            throw new Error(`Unknown item type: "${args!.type}". Available: ${availableNames}`);
          }
          resolvedType = match.id;
        }
        const item = await api('/items', {
          method: 'POST',
          body: JSON.stringify({
            title: args!.title,
            type: resolvedType,
            projectId: args!.project_id,
            workphaseId: args!.workphase_id,
            description: args!.description,
            parentId: args!.parent_id,
            isAttached: args!.is_attached,
          }),
        });
        return {
          content: [{ type: 'text', text: `Created item: ${JSON.stringify(item, null, 2)}` }],
        };
      }

      case 'update_item': {
        const updates: Record<string, unknown> = {};
        if (args!.title !== undefined) updates.title = args!.title;
        if (args!.description !== undefined) updates.description = args!.description;
        if (args!.parent_id !== undefined) updates.parentId = args!.parent_id;
        if (args!.is_attached !== undefined) updates.isAttached = args!.is_attached;
        const item = await api(`/items/${urlPart(args!.item_id)}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        return {
          content: [{ type: 'text', text: `Updated item: ${JSON.stringify(item, null, 2)}` }],
        };
      }

      case 'move_item': {
        // No position given, so the move endpoint resolves it: a move to
        // another workphase keeps the item's existing position
        // (wiki item-positioning §2's workphase-only rule), an item with none
        // to keep is appended, and a done workphase leaves it none. MCP never
        // computes a position itself.
        await api(`/items/${urlPart(args!.item_id)}/move`, {
          method: 'PATCH',
          body: JSON.stringify({ workphaseId: args!.workphase_id }),
        });
        return {
          content: [{ type: 'text', text: `Moved item ${args!.item_id} to workphase ${args!.workphase_id}` }],
        };
      }

      case 'add_item_comment': {
        await api(`/items/${urlPart(args!.item_id)}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: args!.content }),
        });
        return {
          content: [{ type: 'text', text: `Comment added to item ${args!.item_id}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
