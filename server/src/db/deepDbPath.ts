// Which database file the deep seed may wipe and rebuild. Apart from `deepSeed.ts` so that
// `seedDeep.ts` can settle the path before anything opens a connection (`index.ts` opens the
// one `DB_PATH` names, and defaults to the dev database).

import path from 'path';

export const DEFAULT_DEEP_DB_PATH = './data/deep.db';

// A file named `deep….db`, never the dev, test or vitest database.
export function resolveDeepDbPath(requested: string | undefined): string {
  const dbPath = requested || DEFAULT_DEEP_DB_PATH;
  if (!/^deep.*\.db$/.test(path.basename(dbPath))) {
    throw new Error(`The deep seed only writes to a database file named deep….db, not "${dbPath}"`);
  }
  return dbPath;
}
