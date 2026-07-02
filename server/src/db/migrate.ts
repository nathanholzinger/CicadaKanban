import 'dotenv/config';
import { runMigrations } from './runMigrations.js';
import { sqlite } from './index.js';

runMigrations();
sqlite.close();
console.log('Database setup complete.');
