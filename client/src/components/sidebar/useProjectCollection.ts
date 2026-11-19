// The project collection the sidebar and the project page read, and the writes that change it: create, edit,
// delete and the sidebar's move. What it owns:
// - Every project write's answer folds into `projects` (`applyWriteResponse`), in the order the writes were
//   made. A project's own writes go to the server one at a time (`writeInTurn`): one is sent when the
//   earlier one is answered, whether that succeeded or failed, so the last answer is the latest write and
//   none is stale. Different projects' writes don't wait for each other.
// - A move is drawn at its release, by the relation it sends, until its own answer lands (`pendingMoves`,
//   laid over `projects` in `sidebarProjects`): a second move released meanwhile loses neither, and a
//   refused one goes back with its answer (wiki project-tree §4).
// - A read of the whole tree, the first load and the ones after a refused move and after a delete, is applied
//   only when no write's answer has been applied since it started and no later read has started
//   (`readProjects`). An older snapshot is dropped and the tree is read again, so a read never undoes a newer
//   write. The sidebar is `loaded` once the latest read is applied or has failed.
// - A project the server no longer holds stays gone: a delete, and a read that no longer lists a project the
//   collection held, record it (`deletedIds`), and a write answer that lands late for it, or for a child put
//   under it, is dropped (`foldWrite`). A delete isn't queued behind the project's writes, so without this an
//   older move or edit answer would add the deleted row back.
// - An answer renumbers other projects too (`reindexed`), and different projects' writes aren't ordered, so
//   an older answer can land after a newer one that set the same row. Each write is numbered as it is sent,
//   and a row keeps the position of the latest-sent write that set it (`positionWrites`): an older answer's
//   pair for it is skipped (`applyWriteResponse`'s `newer`).
// - An edit opens the parent it put a project under, never one it left alone (wiki project-tree §11). The
//   parent it is compared with is the one the project had when the edit's own answer came to be applied, which
//   earlier answers set (`appliedRows`), not the one it had when the edit was asked for.
// What stays with the caller: which project is selected, the create dialog, and opening a collapsed parent
// (`onParentOpened`), since a collapse is the sidebar's.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '../../types';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  moveProject,
  type ProjectWriteResponse,
  type UpdateProjectInput,
} from '../../api/projects';
import { withMoveApplied, type PendingMove } from '../../lib/hierarchy';
import { applyWriteResponse, positionRecord } from '../../lib/positionedWrite';
import { parentPutUnder } from './projectTreeUtils';

export type CreateProjectInput = Parameters<typeof createProject>[0];

export function useProjectCollection(onParentOpened: (id: string) => void) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  // The moves released and not yet answered, in the order they were released. Each is drawn at once,
  // laid over `projects` where the sidebar reads them, and leaves with its own answer. A move can still
  // be waiting on its project's earlier write (`writeInTurn`), so this order is not the order requests go out.
  const [pendingMoves, setPendingMoves] = useState<PendingMove[]>([]);
  // Each project's last write still out, so its next one waits for that answer (`writeInTurn`).
  const writeTails = useRef(new Map<string, Promise<void>>());
  // How many write answers have been applied, and which read of the whole tree is the latest
  // (`readProjects`).
  const writesApplied = useRef(0);
  const latestRead = useRef(0);
  // The projects the server has deleted. Ids are never reused, so the set only grows.
  const deletedIds = useRef(new Set<string>());
  // The writes sent, numbered, and which one last set each project's position (`foldWrite`).
  const positionWrites = useRef(positionRecord());
  // Each project as the latest answer or read gave it, the raw row, read synchronously where `projects` is a
  // render behind: for the parent a write moved a project from (`foldWrite`'s `before`) and for the ids
  // known, to tell a deleted project from a new one. Not a mirror of `projects`: the reindex fold and a later
  // write's protection of a position act on `projects` alone.
  const appliedRows = useRef(new Map<string, Project>());

  // The one reader of the whole tree. A read that a later one superseded is dropped: the later one decides.
  // One that began before a write's answer was applied is read again, since its snapshot may not have the
  // write. It reads only refs and setters, so it is the same function for the life of the hook.
  const readProjects = useCallback((failure: string) => {
    const attempt = (): Promise<void> => {
      const read = ++latestRead.current;
      const applied = writesApplied.current;
      return fetchProjects()
        .then(fresh => {
          if (read !== latestRead.current) return;
          if (applied !== writesApplied.current) return attempt();
          // No write has landed since the read began, so a project held before it and absent from it was
          // deleted (a project created since would be a write, and isn't held).
          const listed = new Set(fresh.map(p => p.id));
          for (const id of appliedRows.current.keys()) if (!listed.has(id)) deletedIds.current.add(id);
          appliedRows.current = new Map(fresh.map(row => [row.id, row]));
          setProjects(fresh);
          setLoaded(true);
        })
        .catch(err => {
          console.error(failure, err);
          if (read === latestRead.current) setLoaded(true);
        });
    };
    return attempt();
  }, []);

  // React's StrictMode runs this twice in development: the first read is the superseded one.
  useEffect(() => {
    void readProjects('Failed to load projects:');
  }, [readProjects]);

  // `sent` numbers the write as it goes out, which is when the server takes it: after the project's earlier
  // one is answered.
  function writeInTurn<T>(id: string, write: () => Promise<T>): Promise<{ answer: T; sent: number }> {
    const send = () => {
      const sent = positionWrites.current.send();
      return write().then(answer => ({ answer, sent }));
    };
    const earlier = writeTails.current.get(id);
    const run = earlier ? earlier.then(send) : send();
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

  // Folds the answer of write number `sent` into `projects`, unless the project is deleted, or was put under
  // one (the delete took that child too, or the server refused the put). Returns the project as it stood
  // before the answer, or null when the answer wasn't folded.
  function foldWrite(written: ProjectWriteResponse, sent: number): { before: Project | undefined } | null {
    const { id, parentId } = written;
    if (deletedIds.current.has(id) || (parentId && deletedIds.current.has(parentId))) return null;
    const before = appliedRows.current.get(id);
    appliedRows.current.set(id, written);
    // The rows this answer sets, less those a write sent after it has already set.
    const newer = positionWrites.current.answer(sent, written);
    setProjects(prev => applyWriteResponse(prev, written, newer));
    writesApplied.current++;
    return { before };
  }

  async function create(data: CreateProjectInput) {
    try {
      const sent = positionWrites.current.send();
      const created = await createProject(data);
      // A project created under one the server has since deleted isn't drawn, and opens nothing.
      if (!foldWrite(created, sent)) return;
      // A subproject opens its parent, so it shows (wiki project-tree §2).
      const parentId = parentPutUnder(undefined, created);
      if (parentId) onParentOpened(parentId);
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }

  async function update(id: string, data: UpdateProjectInput) {
    try {
      const { answer: updated, sent } = await writeInTurn(id, () => updateProject(id, data));
      const folded = foldWrite(updated, sent);
      if (!folded) return;
      // A project put under a new parent opens it, as a drop does.
      const parentId = parentPutUnder(folded.before, updated);
      if (parentId) onParentOpened(parentId);
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  }

  async function remove(id: string) {
    try {
      await deleteProject(id);
      deletedIds.current.add(id);
      writesApplied.current++;
      void readProjects('Failed to refresh projects after delete:');
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
      const { answer: updated, sent } = await writeInTurn(id, () => moveProject(id, { parentId, prevId, nextId }));
      // One update: the answer's positions replace the drawn move, so no frame shows the old place.
      foldWrite(updated, sent);
      settle();
    } catch (err) {
      // The move goes back with its answer, the project at the place it had before the attempt;
      // the refetch resyncs the tree (wiki project-tree §4).
      console.error('Failed to reposition project:', err);
      settle();
      void readProjects('Failed to refresh projects after failed reorder:');
    }
  }

  // What the sidebar draws: every move still out laid over the tree once, as far as a node knows (its
  // parent), with the moves beside it for the one index that sorts siblings. So its rows, the real
  // tree's children and what the next pickup reads (its subtree and tiers) are one tree, and no
  // position is touched. No move out is the same array.
  const sidebarProjects = pendingMoves.reduce((tree, move) => withMoveApplied(tree, move), projects);

  return { projects, sidebarProjects, pendingMoves, loaded, create, update, remove, reorder };
}
