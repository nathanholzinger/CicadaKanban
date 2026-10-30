import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { renderArtifacts } from './artifacts.js';

it('committed comparison documents types and measurements match their authoring sources', async () => {
  for (const [file, expected] of await renderArtifacts()) {
    const actual = await readFile(new URL(`generated/${file}`, import.meta.url), 'utf8');
    expect(actual, `Stale generated artifact: ${file}`).toBe(expected);
  }
}, 30000);
