import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { renderArtifacts } from './artifacts.js';

const check = process.argv.includes('--check');
const directory = new URL('./generated/', import.meta.url);
if (!check) await mkdir(directory, { recursive: true });
for (const [file, formatted] of await renderArtifacts()) {
  const target = new URL(file, directory);
  if (check) {
    if ((await readFile(target, 'utf8')) !== formatted) throw new Error(`Stale generated artifact: ${file}`);
  } else await writeFile(target, formatted);
  process.stdout.write(`${file}: ${check ? 'current' : 'generated'}\n`);
}
