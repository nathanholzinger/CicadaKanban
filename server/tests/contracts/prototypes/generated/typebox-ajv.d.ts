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
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Id: string;
    /** @enum {unknown} */
    Side: 'before' | 'after';
    /** @enum {unknown} */
    PositionScope: 'attached-siblings' | 'workflow' | 'none';
    ReindexedPosition: {
      id: string;
      position: number;
    };
    ItemMove: ({
      position?: unknown;
      parentId?: string | null;
      isAttached?: boolean;
      workphaseId?: string | null;
      anchorId?: unknown;
      side?: unknown;
      scopeWorkphaseIds?: unknown;
    } & {
      [key: string]: unknown;
    }) &
      ((
        | unknown
        | unknown
        | unknown
        | unknown
        | {
            scopeWorkphaseIds: unknown[];
          }
      ) &
        unknown);
    ProjectMove:
      | ({
          position?: unknown;
          parentId?: string | null;
          prevId?: string | null;
          nextId?: string | null;
        } & {
          [key: string]: unknown;
        })
      | unknown[];
    ItemWrite: {
      id: string;
      type: string | null;
      parentId: string | null;
      projectId: string | null;
      workphaseId: string | null;
      title: string;
      description: string | null;
      position: number | null;
      isAttached: number;
      assigneeType: string | null;
      agentId: string | null;
      createdAt: number;
      updatedAt: number;
      completedAt: number | null;
      /** @enum {unknown} */
      positionScope: 'attached-siblings' | 'workflow' | 'none';
      reindexed?: {
        id: string;
        position: number;
      }[];
    };
    ProjectWrite: {
      id: string;
      parentId: string | null;
      name: string;
      description: string | null;
      position: number | null;
      createdAt: number;
      updatedAt: number;
      reindexed?: {
        id: string;
        position: number;
      }[];
    };
    Error: {
      error: string;
    };
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
      /** @description Stored row with optional reindex disclosure */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ItemWrite'];
        };
      };
      /** @description Existing validation or domain refusal */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Target not found before handler validation */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing global error-handler response */
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
      /** @description Stored row with optional reindex disclosure */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProjectWrite'];
        };
      };
      /** @description Existing validation or domain refusal */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Target not found before handler validation */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Error'];
        };
      };
      /** @description Existing global error-handler response */
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
