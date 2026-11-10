// Removes every slot's database and its WAL and SHM files once a run is over.
//
// This can't be `globalTeardown`: Playwright stops the web servers after it,
// and on Windows a server still holds its database open, so the unlink fails
// with EBUSY. A reporter's `onExit` runs after the servers are stopped. A run
// that names its own `--reporter` replaces this one and leaves the files, which
// the next run reuses and resets.

import fs from 'fs';
import path from 'path';
import type { Reporter } from '@playwright/test/reporter';
import { dbFiles, workerCount } from './slots';

const RETRIES = 10;
const RETRY_DELAY_MS = 200;

async function remove(filePath: string): Promise<void> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      fs.rmSync(filePath, { force: true });
      return;
    } catch {
      // A just-stopped server can take a moment to let go of the file.
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  console.warn(`Could not remove ${filePath}`);
}

export default class RemoveDatabasesReporter implements Reporter {
  async onExit(): Promise<void> {
    const serverDataDir = path.resolve(process.cwd(), 'server', 'data');
    for (let slot = 0; slot < workerCount(); slot++) {
      for (const file of dbFiles(slot)) await remove(path.join(serverDataDir, file));
    }
  }
}
