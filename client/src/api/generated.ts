// Generated from openapi.ts::createContractDocument; do not edit.
export interface paths {
  '/api/items/{id}/move': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations['moveItem'];
    trace?: never;
  };
  '/api/projects/{id}/move': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations['moveProject'];
    trace?: never;
  };
  '/api/items/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['getItem'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/workflows': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['listWorkflows'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Id: string;
    IdParams: {
      id: components['schemas']['Id'];
    };
    /** @enum {string} */
    Side: 'before' | 'after';
    /** @enum {string} */
    PositionScope: 'attached-siblings' | 'workflow' | 'none';
    ReindexedPosition: {
      id: components['schemas']['Id'];
      position: number;
    };
    Error: {
      error: string;
    };
    ItemMoveFields: {
      parentId?: components['schemas']['Id'] | null;
      isAttached?: boolean;
      workphaseId?: components['schemas']['Id'] | null;
      anchorId?: unknown;
      side?: unknown;
      position?: unknown;
      scopeWorkphaseIds?: unknown;
    } & {
      [key: string]: unknown;
    };
    ItemMove: components['schemas']['ItemMoveFields'] &
      (
        | ({
            workphaseId: unknown;
          } & {
            [key: string]: unknown;
          })
        | ({
            anchorId: unknown;
          } & {
            [key: string]: unknown;
          })
        | ({
            parentId: unknown;
          } & {
            [key: string]: unknown;
          })
        | ({
            isAttached: unknown;
          } & {
            [key: string]: unknown;
          })
        | ({
            scopeWorkphaseIds: unknown[];
          } & {
            [key: string]: unknown;
          })
      ) &
      (
        | ({
            anchorId?: unknown;
          } & {
            [key: string]: unknown;
          })
        | ({
            anchorId: unknown;
            side: components['schemas']['Side'];
          } & {
            [key: string]: unknown;
          })
      );
    Item: {
      id: components['schemas']['Id'];
      type: components['schemas']['Id'] | null;
      parentId: components['schemas']['Id'] | null;
      projectId: components['schemas']['Id'] | null;
      workphaseId: components['schemas']['Id'] | null;
      title: string;
      description: string | null;
      position: number | null;
      isAttached: number;
      assigneeType: string | null;
      agentId: components['schemas']['Id'] | null;
      createdAt: number;
      updatedAt: number;
      completedAt: number | null;
      positionScope: components['schemas']['PositionScope'];
    };
    ItemChild: {
      id: components['schemas']['Id'];
      type: components['schemas']['Id'] | null;
      parentId: components['schemas']['Id'] | null;
      projectId: components['schemas']['Id'] | null;
      workphaseId: components['schemas']['Id'] | null;
      title: string;
      description: string | null;
      position: number | null;
      isAttached: number;
      assigneeType: string | null;
      agentId: components['schemas']['Id'] | null;
      createdAt: number;
      updatedAt: number;
      completedAt: number | null;
      positionScope: components['schemas']['PositionScope'];
      depth: number;
    };
    ItemDetail: {
      id: components['schemas']['Id'];
      type: components['schemas']['Id'] | null;
      parentId: components['schemas']['Id'] | null;
      projectId: components['schemas']['Id'] | null;
      workphaseId: components['schemas']['Id'] | null;
      title: string;
      description: string | null;
      position: number | null;
      isAttached: number;
      assigneeType: string | null;
      agentId: components['schemas']['Id'] | null;
      createdAt: number;
      updatedAt: number;
      completedAt: number | null;
      positionScope: components['schemas']['PositionScope'];
      depth: number;
      workflowId: components['schemas']['Id'] | null;
      children: components['schemas']['ItemChild'][];
      activity: components['schemas']['Activity'][];
    };
    ItemWrite: {
      id: components['schemas']['Id'];
      type: components['schemas']['Id'] | null;
      parentId: components['schemas']['Id'] | null;
      projectId: components['schemas']['Id'] | null;
      workphaseId: components['schemas']['Id'] | null;
      title: string;
      description: string | null;
      position: number | null;
      isAttached: number;
      assigneeType: string | null;
      agentId: components['schemas']['Id'] | null;
      createdAt: number;
      updatedAt: number;
      completedAt: number | null;
      positionScope: components['schemas']['PositionScope'];
      reindexed?: components['schemas']['ReindexedPosition'][];
    };
    Activity: {
      id: components['schemas']['Id'];
      itemId: components['schemas']['Id'];
      type: string;
      content: string;
      metadata: string | null;
      createdAt: number;
    };
    ProjectMoveFields: {
      parentId?: components['schemas']['Id'] | null;
      prevId?: components['schemas']['Id'] | null;
      nextId?: components['schemas']['Id'] | null;
      position?: unknown;
    } & {
      [key: string]: unknown;
    };
    ProjectMove: components['schemas']['ProjectMoveFields'] | unknown[];
    Project: {
      id: components['schemas']['Id'];
      parentId: components['schemas']['Id'] | null;
      name: string;
      description: string | null;
      position: number | null;
      createdAt: number;
      updatedAt: number;
    };
    ProjectWrite: {
      id: components['schemas']['Id'];
      parentId: components['schemas']['Id'] | null;
      name: string;
      description: string | null;
      position: number | null;
      createdAt: number;
      updatedAt: number;
      reindexed?: components['schemas']['ReindexedPosition'][];
    };
    WorkflowProjectFilter: string | string[];
    WorkflowQuery: {
      projectId?: components['schemas']['WorkflowProjectFilter'];
    } & {
      [key: string]: unknown;
    };
    Workflow: {
      id: components['schemas']['Id'];
      projectId: components['schemas']['Id'] | null;
      name: string;
      description: string | null;
      createdAt: number;
      updatedAt: number;
    };
    WorkflowList: components['schemas']['Workflow'][];
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  moveItem: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['schemas']['Id'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ItemMove'];
      };
    };
    responses: {
      /** @description Existing success response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ItemWrite'];
        };
      };
      /** @description Existing error response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing error response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing error response */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
    };
  };
  moveProject: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['schemas']['Id'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProjectMove'];
      };
    };
    responses: {
      /** @description Existing success response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProjectWrite'];
        };
      };
      /** @description Existing error response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing error response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing error response */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
    };
  };
  getItem: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['schemas']['Id'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Existing success response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ItemDetail'];
        };
      };
      /** @description Existing error response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing error response */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
    };
  };
  listWorkflows: {
    parameters: {
      query?: {
        projectId?: components['schemas']['WorkflowProjectFilter'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Existing success response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['WorkflowList'];
        };
      };
      /** @description Existing error response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing error response */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
    };
  };
}
