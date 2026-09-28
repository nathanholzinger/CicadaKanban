// The command line: `[--rules <id>[,<id>...]] [--] [paths...]`. `--rules` may come before or
// after the paths, and a standalone `--` ends the options, so everything after it is a path.

import { RULE_IDS, isRuleId, type RuleId } from './rules.mts';

export type ParsedArgs = { rules: ReadonlySet<RuleId> | null; paths: string[] } | { error: string };

export function parseArgs(args: readonly string[]): ParsedArgs {
  let rules: Set<RuleId> | null = null;
  const paths: string[] = [];
  let optionsEnded = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (optionsEnded || !arg.startsWith('--')) {
      paths.push(arg);
      continue;
    }
    if (arg === '--') {
      optionsEnded = true;
      continue;
    }
    const [name, inline] = arg.split(/=(.*)/s, 2);
    if (name !== '--rules') return { error: `unknown option ${name}` };

    const list = inline ?? args[++i];
    const ids = (list ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    if (ids.length === 0) return { error: '--rules needs a comma-separated list of rule IDs' };
    const unknown = ids.filter(id => !isRuleId(id));
    if (unknown.length > 0)
      return { error: `unknown rule ${unknown.join(', ')}; the rules are ${RULE_IDS.join(', ')}` };
    rules = new Set([...(rules ?? []), ...ids.filter(isRuleId)]);
  }

  return { rules, paths };
}
