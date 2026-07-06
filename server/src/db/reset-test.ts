import 'dotenv/config';
import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './data/test.db';

if (!fs.existsSync(dbPath)) {
  console.log('No test database found, skipping reset.');
  process.exit(0);
}

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');
db.exec(`
  DROP TABLE IF EXISTS item_labels;
  DROP TABLE IF EXISTS attachments;
  DROP TABLE IF EXISTS activity_log;
  DROP TABLE IF EXISTS notifications;
  DROP TABLE IF EXISTS chat_messages;
  DROP TABLE IF EXISTS chat_threads;
  DROP TABLE IF EXISTS items;
  DROP TABLE IF EXISTS columns;
  DROP TABLE IF EXISTS labels;
  DROP TABLE IF EXISTS workflow_template_columns;
  DROP TABLE IF EXISTS workflow_templates;
  DROP TABLE IF EXISTS workflows;
  DROP TABLE IF EXISTS projects;
  DROP TABLE IF EXISTS agents;
  DROP TABLE IF EXISTS item_types;
  DROP TABLE IF EXISTS __drizzle_migrations;
`);
db.pragma('foreign_keys = ON');
db.close();
console.log('Test database reset complete.');
