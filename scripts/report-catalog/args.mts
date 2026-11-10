// The command line: `[--out <path>]`. The option takes its value after a space or an "=".

export type ParsedArgs = { out: string | null } | { error: string };

export function parseArgs(args: readonly string[]): ParsedArgs {
  let out: string | null = null;
  for (let i = 0; i < args.length; i++) {
    const [name, inline] = args[i].split(/=(.*)/s, 2);
    if (name !== '--out') return { error: `unknown option ${args[i]}` };
    const value = inline ?? args[++i];
    if (value === undefined || value === '') return { error: '--out needs a file to write the report to' };
    out = value;
  }
  return { out };
}
