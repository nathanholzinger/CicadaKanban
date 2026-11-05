// The project collection the sidebar and the project page read, and the writes that change it: create, edit,
// delete and the sidebar's move. What it owns:
// - Every project write's answer folds into `projects` (`applyWriteResponse`), in the order the writes were
//   made. A project's own writes go to the server one at a time (`writeInTurn`): one is sent when the
//   earlier one is answered, whether that succeeded or failed, so the last answer is the latest write and
//   none is stale. Different projects' writes don't wait for each other.
// - A move is drawn at its release, by the relation it sends, until its own answer lands (`pendingMoves`,
//   laid over `projects` in `sidebarProjects`): a second move released meanwhile loses neither, and a
//   refused one goes back with its answer (wiki project-tree §4).
// - A read of the whole tree, after a refused move and after a delete, is applied only when no write's answer
//   has been applied since it started (`refreshProjects`). An older snapshot is dropped and the tree is read
//   again, so a recovery never undoes a newer write.
// What stays with the caller: which project is selected, the create dialog, and opening a collapsed parent
// (`onParentOpened`), since a collapse is the sidebar's.

import { useEffect, useRef, useState } from 'react';
import type { Project } from '../../types';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  moveProject,
  type UpdateProjectInput,
} from '../../api/projects';
import { withMoveApplied, type PendingMove } from '../../lib/hierarchy';
import { applyWriteResponse } from '../../lib/positionedWrite';
import { parentPutUnder } from './projectTreeUtils';

export type CreateProjectInput = Parameters<typeof createProject>[0];

export function useProjectCollection(onParentOpened: (id: string) => void) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  // The moves that are sent and not yet answered, oldest first. Each is drawn at once, laid over `projects`
  // where the sidebar reads them, and leaves with its own answer.
  const [pendingMoves, setPendingMoves] = useState<PendingMove[]>([]);
  // Each project's last write still out, so its next one waits for that answer (`writeInTurn`).
  const writeTails = useRef(new Map<string, Promise<void>>());
  // How many write answers have been applied, and which read of the whole tree is the latest
  // (`refreshProjects`).
  const writesApplied = useRef(0);
  const latestRead = useRef(0);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(err => console.error('Failed to load projects:', err))
      .finally(() => setLoaded(true));
  }, []);

  function writeInTurn<T>(id: string, write: () => Promise<T>): Promise<T> {
    const earlier = writeTails.current.get(id);
    const run = earlier ? earlier.then(write) : write();
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    writeTails.current.set(id, tail);
    void tail.then(() => {
      if (writeTails.current.get(id) === tail) writeTails.current.delete(id);
    });
    return run;
  }

  async function refreshProjects(failure: string) {
    const read = ++latestRead.current;
    const applied = writesApplied.current;
    try {
      const fresh = await fetchProjects();
      if (read !== latestRead.current) return;
      if (applied !== writesApplied.current) return refreshProjects(failure);
      setProjects(fresh);
    } catch (err) {
      console.error(failure, err);
    }
  }

  async function create(data: CreateProjectInput) {
    try {
      const created = await createProject(data);
      setProjects(prev => applyWriteResponse(prev, created));
      writesApplied.current++;
      // A subproject opens its parent, so it shows (wiki project-tree §2).
      const parentId = parentPutUnder(undefined, created);
      if (parentId) onParentOpened(parentId);
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }

  async function update(id: string, data: UpdateProjectInput) {
    const before = projects.find(p => p.id === id);
    try {
      const updated = await writeInTurn(id, () => updateProject(id, data));
      setProjects(prev => applyWriteResponse(prev, updated));
      writesApplied.current++;
      // A project put under a new parent opens it, as a drop does.
      const parentId = parentPutUnder(before, updated);
      if (parentId) onParentOpened(parentId);
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  }

  async function remove(id: string) {
    try {
      await deleteProject(id);
      writesApplied.current++;
      void refreshProjects('Failed to refresh projects after delete:');
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  }

  async function reorder(id: string, parentId: string | null, prevId: string | null, nextId: string | null) {
    const pending: PendingMove = { id, parentId, prevId, nextId };
    setPendingMoves(prev => [...prev, pending]);
    const settle = () => setPendingMoves(prev => prev.filter(move => move !== pending));
    try {
      const updated = await writeInTurn(id, () => moveProject(id, { parentId, prevId, nextId }));
      // One update: the answer's positions replace the drawn move, so no frame shows the old place.
      setProjects(prev => applyWriteResponse(prev, updated));
      writesApplied.current++;
      settle();
    } catch (err) {
      // The move goes back with its answer, the project at the place it had before the attempt;
      // the refetch resyncs the tree (wiki project-tree §4).
      console.error('Failed to reposition project:', err);
      settle();
      void refreshProjects('Failed to refresh projects after failed reorder:');
    }
  }

  // What the sidebar draws: every move still out laid over the tree once, as far as a node knows (its
  // parent), with the moves beside it for the one index that sorts siblings. So its rows, the real
  // tree's children and what the next pickup reads (its subtree and tiers) are one tree, and no
  // position is touched. No move out is the same array.
  const sidebarProjects = pendingMoves.reduce((tree, move) => withMoveApplied(tree, move), projects);

  return { projects, sidebarProjects, pendingMoves, loaded, create, update, remove, reorder };
}
