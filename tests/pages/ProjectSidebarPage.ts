import type { Page } from '@playwright/test';

export class ProjectSidebarPage {
  readonly locator;
  readonly newProjectButton;

  constructor(page: Page) {
    this.locator = page.locator('aside');
    this.newProjectButton = page.getByTitle('New project');
  }

  row(name: string) {
    return this.locator.getByText(name, { exact: true }).locator('..');
  }

  projectName(name: string) {
    return this.locator.getByText(name);
  }

  async select(name: string) {
    await this.locator.getByText(name, { exact: true }).click();
  }

  async toggle(name: string) {
    await this.row(name).getByTitle(/Collapse|Expand/).click();
  }
}
