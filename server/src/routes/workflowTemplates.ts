import { Router } from 'express';
import { db } from '../db/index.js';
import { workflowTemplates, workflowTemplatePhases } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getOrNotFound } from '../lib/getOrNotFound.js';

const router = Router();

// List all templates with their workphases
router.get('/', (_req, res) => {
  const templates = db.select().from(workflowTemplates).all();
  const result = templates.map(t => ({
    ...t,
    workphases: db.select().from(workflowTemplatePhases)
      .where(eq(workflowTemplatePhases.templateId, t.id))
      .orderBy(workflowTemplatePhases.position)
      .all(),
  }));
  res.json(result);
});

// Get a single template with its workphases
router.get('/:id', (req, res) => {
  const template = getOrNotFound(db.select().from(workflowTemplates).where(eq(workflowTemplates.id, req.params.id)).get(), res, 'Workflow template not found');
  if (!template) return;
  const templatePhases = db.select().from(workflowTemplatePhases)
    .where(eq(workflowTemplatePhases.templateId, req.params.id))
    .orderBy(workflowTemplatePhases.position)
    .all();
  res.json({ ...template, workphases: templatePhases });
});

export default router;
