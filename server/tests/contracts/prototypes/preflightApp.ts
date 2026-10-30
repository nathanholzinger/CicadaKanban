// Isolated structural-validation adapter in front of the existing app. Domain writes still
// execute through the existing handlers, so parity here does not claim those handlers were migrated.

import express, { type RequestHandler } from 'express';
import cors from 'cors';
import { app } from '../../../src/index.js';
import { items, projects } from '../../../src/db/schema.js';
import { getByIdOrNotFound } from '../../../src/lib/getOrNotFound.js';
import { requestIssue, type Candidate, type Resource } from './model.js';

export function preflightApp(candidate: Candidate) {
  const prototype = express();
  prototype.use(cors());
  prototype.use(express.json());
  const preflight =
    (resource: Resource): RequestHandler =>
    (req, res, next) => {
      const id = req.params.id;
      if (typeof id !== 'string') throw new Error('Expected a path segment');
      const target =
        resource === 'item'
          ? getByIdOrNotFound(items, id, res, 'Item not found')
          : getByIdOrNotFound(projects, id, res, 'Project not found');
      if (!target) return;
      const issue = requestIssue(candidate, resource, req.body);
      if (issue) {
        res.status(400).json({ error: issue });
        return;
      }
      next();
    };
  prototype.patch('/api/items/:id/move', preflight('item'));
  prototype.patch('/api/projects/:id/move', preflight('project'));
  prototype.use(app);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express recognizes error middleware by its four parameters
  prototype.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
  return prototype;
}
