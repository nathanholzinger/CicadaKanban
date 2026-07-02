import { test as base } from '@playwright/test';
import { ProjectSidebarPage } from './pages/ProjectSidebarPage';

export const test = base.extend<{ projectSidebar: ProjectSidebarPage }>({
  projectSidebar: async ({ page }, use) => {
    await use(new ProjectSidebarPage(page));
  },
});

export { expect } from '@playwright/test';
