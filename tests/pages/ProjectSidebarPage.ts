import type { Page } from '@playwright/test';

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
    await this.select(name);
    await this.page.locator('main').getByRole('button', { name: 'Board', exact: true }).click();
  }

  row(name: string) {
    return this.locator.getByText(name, { exact: true }).locator('..');
  }

  projectName(name: string) {
    return this.locator.getByText(name);
  }

  // The grab handle on a project's row. Resolve it before the drag starts:
  // the carried copy repeats the project's name.
  dragHandle(name: string) {
    return this.row(name).getByLabel('Drag to reorder');
  }

  get dragHandles() {
    return this.locator.getByLabel('Drag to reorder');
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
