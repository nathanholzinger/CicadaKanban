import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import boardRoutes from './routes/boards.js';
import columnRoutes from './routes/columns.js';
import workItemRoutes from './routes/workItems.js';
import agentRoutes from './routes/agents.js';
import notificationRoutes from './routes/notifications.js';
import labelRoutes from './routes/labels.js';
import attachmentRoutes from './routes/attachments.js';
import itemTypeRoutes from './routes/itemTypes.js';
import testHelperRoutes from './routes/testHelpers.js';
import { runMigrations } from './db/runMigrations.js';

runMigrations();

const app = express();
const HOST = process.env.HOST || 'localhost';
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/work-items', workItemRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/item-types', itemTypeRoutes);

if (process.env.ENABLE_TEST_ROUTES === 'true') {
  app.use('/api/test', testHelperRoutes);
  console.log('Test helper routes enabled.');
}

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});