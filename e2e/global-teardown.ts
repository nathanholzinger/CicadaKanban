import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  const serverDataDir = path.resolve(process.cwd(), 'server', 'data');
  for (const file of ['test.db', 'test.db-wal', 'test.db-shm']) {
    const filePath = path.join(serverDataDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
