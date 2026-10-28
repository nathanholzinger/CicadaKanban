// How a run splits its files among pass instances: the area groups, which groups each
// instance of each pass reads, and the files the orchestrator marks read whole by judgment.
// The defaults are the seven area groups the earlier runs used, with E2E and T an instance each
// in every pass, since together they can come to more than one instance reads. A config file
// (JSON) replaces whichever of its three keys it gives, and is checked here, shapes and
// patterns included, so a bad one stops the run before it scans.

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

/** The files of `client/src/components/` that the drag layer's groups (C1, C1t) take, beside `workflow/`. */
export const BOARD_COMPONENTS = [
  'BandGuides',
  'BoardColumn',
  'BoardView',
  'CardList',
  'DragTuningPanel',
  'HierarchyModal',
  'KanbanCard',
  'ModalShell',
  'StubRows',
  'cardMetrics',
  'dragChrome',
  'UnsortedBucket',
];
const BOARD_ALTERNATION = BOARD_COMPONENTS.join('|');

export const DEFAULT_CONFIG: ScopeConfig = {
  groups: [
    { name: 'S1t', pattern: '^server/tests/' },
    { name: 'S1', pattern: '^(?:CLAUDE\\.md$|server/src/|server/drizzle/)' },
    { name: 'E2E', pattern: '^tests/' },
    {
      name: 'C1t',
      pattern: `^client/src/(?:test/|components/workflow/.*\\.test\\.tsx?$|components/(?:${BOARD_ALTERNATION})\\.test\\.tsx?$)`,
    },
    { name: 'C1', pattern: `^client/src/components/(?:workflow/|(?:${BOARD_ALTERNATION})\\.tsx?$)` },
    { name: 'C2', pattern: '^client/src/' },
    { name: 'T', pattern: '' },
  ],
  instances: {
    correctness: { C1: ['C1'], C1t: ['C1t'], C2: ['C2'], S1: ['S1'], S1t: ['S1t'], E2E: ['E2E'], T: ['T'] },
    drift: { C1: ['C1'], C1t: ['C1t'], C2: ['C2'], S1: ['S1'], S1t: ['S1t'], E2E: ['E2E'], T: ['T'] },
    duplication: {
      'client-src': ['C1', 'C2:src'],
      'client-tests': ['C1t', 'C2:test'],
      server: ['S1', 'S1t'],
      E2E: ['E2E'],
      T: ['T'],
    },
    fileresp: { client: ['C1', 'C1t', 'C2'], server: ['S1', 'S1t'], E2E: ['E2E'], T: ['T'] },
  },
  readWhole: [],
};

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function groupsOf(value: unknown): GroupRule[] {
  const shape = 'groups must be a list of { "name": text, "pattern": text }';
  if (!Array.isArray(value)) throw new Error(shape);
  return value.map((item: unknown) => {
    if (!isRecord(item) || typeof item.name !== 'string' || typeof item.pattern !== 'string') throw new Error(shape);
    try {
      new RegExp(item.pattern);
    } catch (error) {
      throw new Error(`group ${item.name}: the pattern is not a regular expression (${(error as Error).message})`, {
        cause: error,
      });
    }
    return { name: item.name, pattern: item.pattern };
  });
}

function instancesOf(value: unknown): Instances {
  if (!isRecord(value)) throw new Error('instances must be an object, with a key for each pass');
  const instances = { ...value } as Instances;
  for (const pass of PASSES) {
    const given = value[pass];
    if (given === undefined) continue;
    if (!isRecord(given)) throw new Error(`instances.${pass} must map each instance name to a list of group names`);
    for (const [instance, specs] of Object.entries(given)) {
      if (!isStringList(specs)) throw new Error(`instances.${pass}.${instance} must be a list of group names`);
    }
  }
  return instances;
}

/**
 * A config's JSON, over the defaults. Throws on a key it doesn't know, a value of the wrong
 * shape, a group pattern that isn't a regular expression, or an instance naming a group it
 * lacks or a kind it doesn't know.
 */
export function parseConfig(json: string): ScopeConfig {
  const given: unknown = JSON.parse(json);
  if (!isRecord(given)) throw new Error('the config must be a JSON object');
  const unknown = Object.keys(given).filter(key => !(key in DEFAULT_CONFIG));
  if (unknown.length > 0) {
    throw new Error(`unknown config key ${unknown.join(', ')}; the keys are ${Object.keys(DEFAULT_CONFIG).join(', ')}`);
  }
  if (given.readWhole !== undefined && !isStringList(given.readWhole)) {
    throw new Error('readWhole must be a list of file paths');
  }
  const config: ScopeConfig = {
    groups: given.groups === undefined ? DEFAULT_CONFIG.groups : groupsOf(given.groups),
    instances: given.instances === undefined ? DEFAULT_CONFIG.instances : instancesOf(given.instances),
    readWhole: given.readWhole === undefined ? DEFAULT_CONFIG.readWhole : (given.readWhole as string[]),
  };

  const names = new Set(config.groups.map(group => group.name));
  for (const pass of PASSES) {
    for (const [instance, specs] of Object.entries(config.instances[pass] ?? {})) {
      for (const spec of specs) {
        let group: string;
        try {
          group = parseSpec(spec).group;
        } catch (error) {
          throw new Error(`${pass} instance ${instance}: ${(error as Error).message}`, { cause: error });
        }
        if (!names.has(group)) throw new Error(`${pass} instance ${instance} reads "${spec}", a group not defined`);
      }
    }
  }
  return config;
}

export interface Spec {
  group: string;
  /** `src` takes the group's source files only, `test` its test files only; null takes both. */
  kind: 'src' | 'test' | null;
}

/** An instance's spec: a group name, with an optional `:src` or `:test` kind. Throws on any other kind. */
export function parseSpec(spec: string): Spec {
  const [group, kind, ...rest] = spec.split(':');
  if (rest.length > 0 || (kind !== undefined && kind !== 'src' && kind !== 'test')) {
    throw new Error(`"${spec}" has a kind other than src or test`);
  }
  return { group, kind: kind ?? null };
}

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
  const parsed = parseSpec(spec);
  if (parsed.group !== group) return false;
  if (parsed.kind === 'src') return !isTestPath(file);
  if (parsed.kind === 'test') return isTestPath(file);
  return true;
}
