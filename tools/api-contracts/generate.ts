import { writeOrCheckArtifacts } from './artifacts.js';

await writeOrCheckArtifacts(process.argv.includes('--check'));
