// Builds the deep database (`deepSeed.ts`) from scratch: the file is removed and migrated anew,
// then seeded. Run it with `npm run seed:deep` from `server/`. The file is `data/deep.db`, or the
// `DB_PATH` given when it is named `deep….db`; no other database is ever touched.

import fs from 'fs';
import { resolveDeepDbPath } from './deepDbPath.js';

const dbPath = resolveDeepDbPath(process.env.DB_PATH);
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(`${dbPath}${suffix}`, { force: true });

// The connection reads `DB_PATH` once at import, so it is set before anything that opens one
// is imported.
process.env.DB_PATH = dbPath;
const { runMigrations } = await import('./runMigrations.js');
const { seedDeepData } = await import('./deepSeed.js');
runMigrations();
const summary = seedDeepData();
console.log(
  `Seeded ${dbPath}: projects ${summary.deepestProjectDepth + 1} levels deep, items ${summary.deepestItemDepth} levels below their Card.`,
);
