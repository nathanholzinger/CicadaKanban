import { writeOrCheckPilotArtifacts } from './pilotArtifacts.js';

await writeOrCheckPilotArtifacts(process.argv.includes('--check'));
