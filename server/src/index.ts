// Express entry point: route mounting, global error middleware (registered last).

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projects.js';
import workflowRoutes from './routes/workflows.js';
import workflowTemplateRoutes from './routes/workflowTemplates.js';
import workphaseRoutes from './routes/workphases.js';
import boardRoutes from './routes/boards.js';
import columnRoutes from './routes/columns.js';
import itemRoutes from './routes/items.js';
import agentRoutes from './routes/agents.js';
import notificationRoutes from './routes/notifications.js';
import labelRoutes from './routes/labels.js';
import attachmentRoutes from './routes/attachments.js';
import itemTypeRoutes from './routes/itemTypes.js';
import testHelperRoutes from './routes/testHelpers.js';
import { runMigrations } from './db/runMigrations.js';

runMigrations();

export const app = express();
const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/projects', projectRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/workflow-templates', workflowTemplateRoutes);
app.use('/api/workphases', workphaseRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/item-types', itemTypeRoutes);

if (process.env.ENABLE_TEST_ROUTES === 'true') {
  app.use('/api/test', testHelperRoutes);
  console.log('Test helper routes enabled.');
}

// Backstop for every route: Express 5 auto-forwards rejected promises here,
// and any route that throws synchronously without its own try/catch ends up
// here too. Registered last so it only ever sees errors the routes above
// didn't already handle.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express treats a handler as error middleware only when it declares all four parameters
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Vitest sets process.env.VITEST = 'true' for every test run. Skip binding a
// port so the exported `app` can be driven in-process via supertest instead.
if (!process.env.VITEST) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
}
