import type { Page } from '@playwright/test';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ProjectSidebarPage {
  readonly locator;
  readonly newProjectButton;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.locator = page.locator('aside');
    this.newProjectButton = page.getByTitle('New project');
  }

  // Load the app, select the project, open its Board tab — the three-liner
  // at the top of nearly every board-driven UI spec. Callers still await
  // whatever board content proves the load finished (a specific card, a
  // column group), since that differs per scenario.
  async openBoard(name: string) {
    await this.page.goto('/');
    await this.showBoard(name);
  }

  // The same on the page already loaded, for a spec that mustn't reload it: what
  // the app fetched at mount is part of what it tests, or the page is mid-visit.
  async showBoard(name: string) {
    await this.select(name);
    await this.openBoardTab();
  }

  // `exact`, since a non-exact "Board" also matches "+ New board" and "Rename board"
  // once the tab is showing.
  async openBoardTab() {
    await this.page.locator('main').getByRole('button', { name: 'Board', exact: true }).click();
  }

  row(name: string) {
    return this.locator.getByText(name, { exact: true }).locator('..');
  }

  // Exact, so `P1` is not also `P10`: a chain of projects numbers its levels.
  projectName(name: string) {
    return this.locator.getByText(name, { exact: true });
  }

  // The rows named any of `names`, in render order, for `toHaveText` to read an
  // order against. A name listed here but left out of the expected order fails
  // the assertion if that project is showing.
  projectNames(...names: string[]) {
    return this.locator.getByText(new RegExp(`^(${names.map(escapeRegExp).join('|')})$`));
  }

  // The grab handle on a project's row. Resolve it before the drag starts:
  // the carried copy repeats the project's name.
  dragHandle(name: string) {
    return this.row(name).getByLabel('Drag to reorder');
  }

  get dragHandles() {
    return this.locator.getByLabel('Drag to reorder');
  }

  // The handle on the sidebar's right edge that sets its width.
  get resizeHandle() {
    return this.locator.getByRole('separator', { name: 'Resize sidebar' });
  }

  // The line a drag draws at its gap, on the side of one row.
  get dropLine() {
    return this.locator.locator('[data-drop-line]');
  }

  async select(name: string) {
    await this.locator.getByText(name, { exact: true }).click();
  }

  async toggle(name: string) {
    await this.row(name)
      .getByTitle(/Collapse|Expand/)
      .click();
  }
}
