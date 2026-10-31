// Reads actual Express route layers using mount paths captured at registration time.
// Unknown router layouts fail explicitly instead of inferring hidden matcher closures.

type Layer = { route?: { path: unknown; methods: Record<string, boolean> }; handle?: { stack?: Layer[] } };
type App = { router: { stack: Layer[] } };
export type Mount = { path: string; router: object };

export function discoverRoutes(app: unknown, mounts: readonly Mount[]): string[] {
  const routes: string[] = [];
  const visit = (stack: Layer[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        if (typeof layer.route.path !== 'string') throw new Error('Unsupported route path; review discovery');
        const path = (prefix + (layer.route.path === '/' ? '' : layer.route.path)).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
        for (const [method, enabled] of Object.entries(layer.route.methods)) {
          if (enabled) routes.push(`${method} ${path}`);
        }
      } else if (layer.handle?.stack) {
        const matched = mounts.filter(mount => mount.router === layer.handle);
        if (matched.length !== 1) throw new Error('Unknown or multiply mounted router; review discovery');
        visit(layer.handle.stack, prefix + matched[0].path);
      }
    }
  };
  visit((app as App).router.stack, '');
  if (new Set(routes).size !== routes.length) throw new Error('Duplicate mounted operation');
  return routes.sort();
}

export function assertRouteCoverage(
  discovered: readonly string[],
  registered: readonly string[],
  pending: readonly string[],
) {
  const promised = [...registered, ...pending];
  if (new Set(promised).size !== promised.length) throw new Error('Duplicate registered/pending operation');
  const absent = discovered.filter(key => !promised.includes(key));
  const stale = promised.filter(key => !discovered.includes(key));
  if (absent.length || stale.length)
    throw new Error(`Route coverage disagreement; missing: ${absent.join(', ')}; stale: ${stale.join(', ')}`);
}
