import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeProject } from '../test/projectFixture';
import { ProjectOverviewTab } from './ProjectOverviewTab';

// "Add subproject" stops at the project cap. The tab's depth counts a top-level project as 1, so a
// project at depth CAP is at the cap and takes no child.
const CAP = 3;
const TOP = makeProject('top');
const MIDDLE = makeProject('middle', { parentId: 'top' });
const BOTTOM = makeProject('bottom', { parentId: 'middle' });
const ALL = [TOP, MIDDLE, BOTTOM];

function renderTab(project = MIDDLE, projectDepthCap: number | null = CAP) {
  const onCreateSubproject = vi.fn();
  render(
    <ProjectOverviewTab
      project={project}
      allProjects={ALL}
      subprojects={[]}
      projectDepthCap={projectDepthCap}
      onSelectProject={vi.fn()}
      onUpdate={vi.fn()}
      onCreateSubproject={onCreateSubproject}
      onDeleteSubproject={vi.fn()}
    />,
  );
  return { onCreateSubproject, add: screen.getByRole('button', { name: 'Add subproject' }) };
}

describe('the Overview tab’s Add subproject at the depth cap', () => {
  it('TREE-5.2: is offered one level short of the cap, and names the project as the parent', async () => {
    const { add, onCreateSubproject } = renderTab(MIDDLE);

    expect(add).toBeEnabled();
    expect(add).toHaveAttribute('title', 'Add subproject');
    await userEvent.click(add);
    expect(onCreateSubproject).toHaveBeenCalledWith(MIDDLE.id);
  });

  it('TREE-5.3: shows disabled, saying why, at the cap, and creates nothing', async () => {
    const { add, onCreateSubproject } = renderTab(BOTTOM);

    expect(add).toBeDisabled();
    expect(add).toHaveAttribute('title', `At the depth cap (${CAP} levels)`);
    await userEvent.click(add);
    expect(onCreateSubproject).not.toHaveBeenCalled();
  });

  it('TREE-5.4: is offered at any depth until the cap is read', () => {
    expect(renderTab(BOTTOM, null).add).toBeEnabled();
  });
});
