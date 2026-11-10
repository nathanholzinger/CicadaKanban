import { test as base } from '@playwright/test';
import { ProjectSidebarPage } from './pages/ProjectSidebarPage';
import { clientUrl } from './helpers/slots';

export const test = base.extend<{ projectSidebar: ProjectSidebarPage }>({
  // A browser opens its own slot's client. A restarted worker keeps its
  // parallel index, so it comes back to the same one.
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use, testInfo) => {
    await use(clientUrl(testInfo.parallelIndex));
  },
  projectSidebar: async ({ page }, use) => {
    await use(new ProjectSidebarPage(page));
  },
});

export { expect } from '@playwright/test';
