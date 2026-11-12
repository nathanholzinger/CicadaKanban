// The webServer (server/src/index.ts) runs migrations and seeds on startup, so the
// stack needs no setup here. What this does is keep the machine awake for the run.

import { spawn } from 'child_process';
import path from 'path';

// On Windows, start the holder that blocks idle sleep until this runner exits
// (`helpers/keepAwake.ps1`). Never awaited, and its failure is ignored: a run must
// not fail, or wait, because the machine couldn't be kept awake. Not spawned
// `detached`: Windows PowerShell exits at once when it is given no console.
function keepAwakeForRun(): void {
  if (process.platform !== 'win32') return;
  const script = path.join(__dirname, 'helpers', 'keepAwake.ps1');
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-ParentPid', String(process.pid)];
  try {
    const holder = spawn('powershell.exe', args, { stdio: 'ignore', windowsHide: true });
    holder.on('error', () => {});
    holder.unref();
  } catch {
    // No holder: the run goes on, and may be suspended if nobody touches the machine.
  }
}

export default async function globalSetup() {
  keepAwakeForRun();
}
