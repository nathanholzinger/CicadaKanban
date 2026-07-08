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
      description: 'Get full details of an item including description, children, activity log, and which workflow it belongs to',
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
      description: 'Create a new item and place it in a workflow workphase',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Item title' },
          project_id: { type: 'string', description: 'Project this item belongs to' },
          workphase_id: { type: 'string', description: 'Workphase to place the item in' },
          type: { type: 'string', description: 'Item type name (e.g. "Epic", "Story", "Task") or UUID. Optional.' },
          description: { type: 'string', description: 'Optional item description' },
          parent_id: { type: 'string', description: 'Optional parent item ID' },
        },
        required: ['title', 'project_id', 'workphase_id'],
      },
    },
    {
      name: 'update_item',
      description: "Update an item's title and/or description",
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'The item ID' },
          title: { type: 'string', description: 'New title' },
          description: { type: 'string', description: 'New description' },
        },
        required: ['item_id'],
      },
    },
    {
      name: 'move_item',
      description: 'Move an item to a different workphase in its workflow',
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
        const qs = args?.project_id ? `?projectId=${args.project_id}` : '';
        const workflows = await api(`/workflows${qs}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }],
        };
      }

      case 'get_workflow': {
        const workflow = await api(`/workflows/${args!.workflow_id}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }],
        };
      }

      case 'get_item': {
        const item = await api(`/items/${args!.item_id}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      case 'create_item': {
        let resolvedType: string | null = null;
        if (args!.type) {
          const itemTypes = await api('/item-types') as Array<{ id: string; name: string }>;
          const match = itemTypes.find(
            t => t.name.toLowerCase() === String(args!.type).toLowerCase() || t.id === args!.type,
          );
          if (!match) throw new Error(`Unknown item type: "${args!.type}". Available: ${itemTypes.map(t => t.name).join(', ')}`);
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
        const item = await api(`/items/${args!.item_id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        return {
          content: [{ type: 'text', text: `Updated item: ${JSON.stringify(item, null, 2)}` }],
        };
      }

      case 'move_item': {
        // workflowId is returned on the item response (derived from item's workphase)
        const item = await api(`/items/${args!.item_id}`);
        const workflow = await api(`/workflows/${item.workflowId}`);
        const workphaseItems = (workflow.items as Array<{ workphaseId: string; position: number }>)
          .filter((i: { workphaseId: string }) => i.workphaseId === args!.workphase_id);
        const position = workphaseItems.length > 0
          ? Math.max(...workphaseItems.map((i: { position: number }) => i.position ?? 0)) + 1
          : 1;

        await api(`/items/${args!.item_id}/move`, {
          method: 'PATCH',
          body: JSON.stringify({ workphaseId: args!.workphase_id, position }),
        });
        return {
          content: [{ type: 'text', text: `Moved item "${item.title}" to workphase ${args!.workphase_id}` }],
        };
      }

      case 'add_item_comment': {
        await api(`/items/${args!.item_id}/comments`, {
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
