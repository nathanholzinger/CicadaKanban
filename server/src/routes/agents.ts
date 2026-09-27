import { Router } from 'express';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';

const router = Router();

router.get('/', (_req, res) => {
  const all = db.select().from(agents).orderBy(agents.createdAt).all();
  res.json(all);
});

router.post('/', (req, res) => {
  const { name, claudeProjectId, surface, repoPath, notes } = req.body;

  if (!name || !claudeProjectId || !surface) {
    res.status(400).json({ error: 'name, claudeProjectId, and surface are required' });
    return;
  }
  if (!['chat', 'code', 'cowork'].includes(surface)) {
    res.status(400).json({ error: 'surface must be chat, code, or cowork' });
    return;
  }

  const now = Date.now();
  const id = randomUUID();

  db.insert(agents)
    .values({
      id,
      name,
      claudeProjectId,
      surface,
      repoPath: repoPath || null,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(agents).where(eq(agents.id, id)).get();
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const agent = getByIdOrNotFound(agents, req.params.id, res, 'Agent not found');
  if (!agent) return;

  const { name, claudeProjectId, surface, repoPath, notes } = req.body;

  if (surface && !['chat', 'code', 'cowork'].includes(surface)) {
    res.status(400).json({ error: 'surface must be chat, code, or cowork' });
    return;
  }

  db.update(agents)
    .set({
      name: name ?? agent.name,
      claudeProjectId: claudeProjectId ?? agent.claudeProjectId,
      surface: surface ?? agent.surface,
      repoPath: repoPath !== undefined ? repoPath || null : agent.repoPath,
      notes: notes !== undefined ? notes || null : agent.notes,
      updatedAt: Date.now(),
    })
    .where(eq(agents.id, req.params.id))
    .run();

  const updated = db.select().from(agents).where(eq(agents.id, req.params.id)).get();
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const agent = getByIdOrNotFound(agents, req.params.id, res, 'Agent not found');
  if (!agent) return;

  // Items and chat threads referencing this agent are not blocked — their FK
  // nulls the agentId (ON DELETE SET NULL), unassigning them.
  db.delete(agents).where(eq(agents.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
