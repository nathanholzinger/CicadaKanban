// The command line: `--out <dir> [--base <ref>] [--end <ref>] [--config <file>] [--repo <dir>]`.
// Each option takes its value after a space or an "=".

export interface ScopeArgs {
  out: string;
  /** Null: the newest tag that ends an audit. */
  base: string | null;
  end: string;
  config: string | null;
  /** Null: this repository. */
  repo: string | null;
}

export type ParsedArgs = ScopeArgs | { error: string };

const OPTIONS = ['--out', '--base', '--end', '--config', '--repo'];

export function parseArgs(args: readonly string[]): ParsedArgs {
  const given = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const [name, inline] = args[i].split(/=(.*)/s, 2);
    if (!OPTIONS.includes(name)) return { error: `unknown option ${args[i]}` };
    const value = inline ?? args[++i];
    if (value === undefined || value === '') return { error: `${name} needs a value` };
    given.set(name, value);
  }
  const out = given.get('--out');
  if (out === undefined) return { error: '--out needs a directory to write the scope files to' };
  return {
    out,
    base: given.get('--base') ?? null,
    end: given.get('--end') ?? 'HEAD',
    config: given.get('--config') ?? null,
    repo: given.get('--repo') ?? null,
  };
}
