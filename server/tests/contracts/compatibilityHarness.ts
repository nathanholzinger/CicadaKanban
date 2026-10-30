// Seeds transport examples through the checked server fixtures and captures exact JSON plus
// database deltas. Only generated IDs are relabeled; response arrays, positions and timestamps stay intact.

import { expect, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { sqlite } from '../../src/db/index.js';
import {
  createItem,
  createProject,
  createWorkflow,
  createWorkphase,
  setItemPosition,
  setItemWorkphase,
  setProjectPosition,
} from '../fixtures.js';
import type { CompatibilityCase, FixtureIds, FixtureVariant } from './compatibilityCases.js';

const SEED_TIME = 1800000000000;
const WRITE_TIME = SEED_TIME + 60000;
type Row = Record<string, unknown>;
type DatabaseState = Record<string, Row[]>;

function databaseState(): DatabaseState {
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as {
    name: string;
  }[];
  return Object.fromEntries(
    tables
      .filter(({ name }) => !name.startsWith('_') && !name.startsWith('sqlite_'))
      .map(({ name }) => [
        name,
        sqlite.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all() as Row[],
      ]),
  );
}

function rowKey(row: Row): string {
  return typeof row.id === 'string' ? row.id : JSON.stringify(row);
}

function databaseChanges(before: DatabaseState, after: DatabaseState) {
  const changes: Record<string, unknown> = {};
  for (const table of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const oldRows = new Map((before[table] ?? []).map(row => [rowKey(row), row]));
    const newRows = new Map((after[table] ?? []).map(row => [rowKey(row), row]));
    const added = [...newRows].filter(([key]) => !oldRows.has(key)).map(([, row]) => row);
    const removed = [...oldRows].filter(([key]) => !newRows.has(key)).map(([, row]) => row);
    const updated = [...newRows].flatMap(([key, row]) => {
      const old = oldRows.get(key);
      if (!old) return [];
      const fields = [...new Set([...Object.keys(old), ...Object.keys(row)])].filter(
        field => JSON.stringify(old[field]) !== JSON.stringify(row[field]),
      );
      return fields.length
        ? [
            {
              id: key,
              before: Object.fromEntries(fields.map(f => [f, old[f]])),
              after: Object.fromEntries(fields.map(f => [f, row[f]])),
            },
          ]
        : [];
    });
    if (added.length || removed.length || updated.length) changes[table] = { added, removed, updated };
  }
  return changes;
}

function labelGeneratedIds(state: DatabaseState, labels: Map<string, string>, stage: 'seed' | 'new'): void {
  for (const [table, rows] of Object.entries(state)) {
    let index = 0;
    for (const row of rows) {
      if (typeof row.id === 'string' && !labels.has(row.id)) labels.set(row.id, `<${table}:${stage}:${++index}>`);
    }
  }
}

function relabel(value: unknown, labels: Map<string, string>): unknown {
  if (typeof value === 'string') {
    let result = value;
    for (const [id, label] of labels) result = result.replaceAll(id, label);
    return result;
  }
  if (Array.isArray(value)) return value.map(entry => relabel(entry, labels));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, relabel(entry, labels)]));
  }
  return value;
}

export async function createCompatibilityFixture(variant: FixtureVariant = 'ordinary') {
  vi.spyOn(Date, 'now').mockReturnValue(SEED_TIME);
  const project = await createProject({ name: 'Main' });
  const foreignProject = await createProject({ name: 'Foreign' });
  const movingProject = await createProject({ name: 'Moving project' });
  const prevProject = await createProject({ name: 'Previous project' });
  const nextProject = await createProject({ name: 'Next project' });
  const childProject = await createProject({ name: 'Child project', parentId: project.id });
  const workflow = await createWorkflow(project.id, { name: 'Main workflow' });
  const foreignWorkflow = await createWorkflow(foreignProject.id, { name: 'Foreign workflow' });
  const todo = await createWorkphase(workflow.id, { name: 'Todo' });
  const active = await createWorkphase(workflow.id, { name: 'Active', triggersNotification: true });
  const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
  const foreignPhase = await createWorkphase(foreignWorkflow.id, { name: 'Foreign phase' });
  const itemInput = { projectId: project.id, workphaseId: todo.id };
  const prevItem = await createItem({ ...itemInput, title: 'Previous' });
  const movingItem = await createItem({ ...itemInput, title: 'Moving' });
  const nextItem = await createItem({ ...itemInput, title: 'Next' });
  const parentItem = await createItem({ ...itemInput, title: 'Parent' });
  const attachedChild = await createItem({ parentId: movingItem.id, title: 'Attached child' });
  const detachedChild = await createItem({ parentId: movingItem.id, title: 'Detached child', isAttached: false });
  const anchorChild = await createItem({ parentId: parentItem.id, title: 'Anchor child' });
  const unsortedItem = await createItem({ projectId: project.id, title: 'Unsorted' });
  const doneItem = await createItem({ ...itemInput, title: 'Completed', workphaseId: done.id });
  const foreignItem = await createItem({
    projectId: foreignProject.id,
    workphaseId: foreignPhase.id,
    title: 'Foreign item',
  });
  const refs = {
    project,
    foreignProject,
    movingProject,
    prevProject,
    nextProject,
    childProject,
    workflow,
    foreignWorkflow,
    todo,
    active,
    done,
    foreignPhase,
    prevItem,
    movingItem,
    nextItem,
    parentItem,
    attachedChild,
    detachedChild,
    anchorChild,
    unsortedItem,
    doneItem,
    foreignItem,
  };
  const ids = Object.fromEntries(Object.entries(refs).map(([name, row]) => [name, row.id])) as FixtureIds;
  if (variant === 'item-reindex') setItemPosition(nextItem.id, 1600);
  if (variant === 'project-reindex') setProjectPosition(nextProject.id, 1600);
  if (variant === 'project-null-anchor') setProjectPosition(prevProject.id, null);
  if (variant === 'foreign-item') setItemWorkphase(movingItem.id, foreignPhase.id);
  const labels = new Map(Object.entries(ids).map(([name, id]) => [id, `<${name}>`]));
  const before = databaseState();
  labelGeneratedIds(before, labels, 'seed');
  vi.mocked(Date.now).mockReturnValue(WRITE_TIME);
  return { ids, labels, before };
}

export async function captureCompatibilityCase(
  targetApp: Express,
  example: CompatibilityCase,
  fixture: Awaited<ReturnType<typeof createCompatibilityFixture>>,
) {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const path = example.path(fixture.ids);
  const body = example.body?.(fixture.ids);
  let call = request(targetApp)[example.method](path);
  if (example.rawBody !== undefined) call = call.set('Content-Type', 'application/json').send(example.rawBody);
  else if (body !== undefined) call = call.send(body);
  const response = await call;
  const after = databaseState();
  if (example.method === 'get' || response.status >= 400) expect(after).toEqual(fixture.before);
  expect(response.status).toBe(example.status);
  labelGeneratedIds(after, fixture.labels, 'new');
  return relabel(
    {
      request: {
        method: example.method,
        path,
        ...(example.rawBody !== undefined ? { rawBody: example.rawBody } : { body }),
      },
      status: response.status,
      response: response.body,
      unhandledErrorLogged: errors.mock.calls.length > 0,
      changes: databaseChanges(fixture.before, after),
    },
    fixture.labels,
  );
}
