// How a run splits its files among pass instances: the area groups, which groups each
// instance of each pass reads, and the files the orchestrator marks read whole by judgment.
// The defaults are the seven area groups both of the earlier runs used. A config file
// (JSON) replaces whichever of its three keys it gives.

export const PASSES = ['correctness', 'drift', 'duplication', 'fileresp'] as const;
export type Pass = (typeof PASSES)[number];

/** A file belongs to the first group whose pattern matches its path. */
export interface GroupRule {
  name: string;
  /** A regular expression's source; the empty pattern matches every path. */
  pattern: string;
}

/**
 * Per pass, its instances, each the groups it reads. `C2:src` and `C2:test` take only the
 * group's source files, or only its test files.
 */
export type Instances = Record<Pass, Record<string, string[]>>;

export interface ScopeConfig {
  groups: GroupRule[];
  instances: Instances;
  /** Files marked read whole beyond those the rules mark. */
  readWhole: string[];
}

const BOARD_COMPONENTS = [
  'BandGuides',
  'BoardColumn',
  'BoardView',
  'CardList',
  'DragTuningPanel',
  'KanbanCard',
  'StubRows',
  'cardMetrics',
  'dragChrome',
  'AttachGhostRow',
  'UnsortedBucket',
].join('|');

export const DEFAULT_CONFIG: ScopeConfig = {
  groups: [
    { name: 'S1t', pattern: '^server/tests/' },
    { name: 'S1', pattern: '^(?:CLAUDE\\.md$|server/src/|server/drizzle/)' },
    { name: 'E2E', pattern: '^tests/' },
    {
      name: 'C1t',
      pattern: `^client/src/(?:test/|components/workflow/.*\\.test\\.tsx?$|components/(?:${BOARD_COMPONENTS})\\.test\\.tsx?$)`,
    },
    { name: 'C1', pattern: `^client/src/components/(?:workflow/|(?:${BOARD_COMPONENTS})\\.tsx?$)` },
    { name: 'C2', pattern: '^client/src/' },
    { name: 'T', pattern: '' },
  ],
  instances: {
    correctness: { C1: ['C1'], C1t: ['C1t'], C2: ['C2'], S1: ['S1'], S1t: ['S1t'], 'E2E-T': ['E2E', 'T'] },
    drift: { C1: ['C1'], C1t: ['C1t'], C2: ['C2'], S1: ['S1'], S1t: ['S1t'], 'E2E-T': ['E2E', 'T'] },
    duplication: {
      'client-src': ['C1', 'C2:src'],
      'client-tests': ['C1t', 'C2:test'],
      server: ['S1', 'S1t'],
      'E2E-T': ['E2E', 'T'],
    },
    fileresp: { client: ['C1', 'C1t', 'C2'], server: ['S1', 'S1t'], 'E2E-T': ['E2E', 'T'] },
  },
  readWhole: [],
};

/** A config's JSON, over the defaults. Throws on a key it doesn't know, or an instance naming a group it lacks. */
export function parseConfig(json: string): ScopeConfig {
  const given: unknown = JSON.parse(json);
  if (typeof given !== 'object' || given === null || Array.isArray(given)) {
    throw new Error('the config must be a JSON object');
  }
  const unknown = Object.keys(given).filter(key => !(key in DEFAULT_CONFIG));
  if (unknown.length > 0) {
    throw new Error(`unknown config key ${unknown.join(', ')}; the keys are ${Object.keys(DEFAULT_CONFIG).join(', ')}`);
  }
  const config: ScopeConfig = { ...DEFAULT_CONFIG, ...(given as Partial<ScopeConfig>) };

  const names = new Set(config.groups.map(group => group.name));
  for (const pass of PASSES) {
    for (const [instance, specs] of Object.entries(config.instances[pass] ?? {})) {
      for (const spec of specs) {
        if (!names.has(groupName(spec)))
          throw new Error(`${pass} instance ${instance} reads "${spec}", a group not defined`);
      }
    }
  }
  return config;
}

/** The group a spec names, without its `:src` or `:test` kind. */
export const groupName = (spec: string): string => spec.split(':')[0];

/** Whether a path is a test file, for the `:src` and `:test` kinds. */
export const isTestPath = (file: string): boolean => file.includes('.test.') || file.includes('/test/');

/** The group a path belongs to; throws when the groups leave it out. */
export function groupOf(groups: readonly GroupRule[]): (file: string) => string {
  const compiled = groups.map(group => ({ name: group.name, pattern: new RegExp(group.pattern) }));
  return file => {
    const found = compiled.find(group => group.pattern.test(file));
    if (!found) throw new Error(`no group matches ${file}; end the groups with one whose pattern is empty`);
    return found.name;
  };
}

/** Whether a file is in the part of a group an instance's spec takes. */
export function specTakes(spec: string, group: string, file: string): boolean {
  const [name, kind] = spec.split(':');
  if (name !== group) return false;
  if (kind === 'src') return !isTestPath(file);
  if (kind === 'test') return isTestPath(file);
  return true;
}
