import { Router } from 'express';
import { db } from '../db/index.js';
import { workflowTemplates, workflowTemplateColumns } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// List all templates with their columns
router.get('/', (_req, res) => {
  const templates = db.select().from(workflowTemplates).all();
  const result = templates.map(t => ({
    ...t,
    columns: db.select().from(workflowTemplateColumns)
      .where(eq(workflowTemplateColumns.templateId, t.id))
      .orderBy(workflowTemplateColumns.position)
      .all(),
  }));
  res.json(result);
});

// Get a single template with its columns
router.get('/:id', (req, res) => {
  const template = db.select().from(workflowTemplates).where(eq(workflowTemplates.id, req.params.id)).get();
  if (!template) {
    res.status(404).json({ error: 'Workflow template not found' });
    return;
  }
  const templateColumns = db.select().from(workflowTemplateColumns)
    .where(eq(workflowTemplateColumns.templateId, req.params.id))
    .orderBy(workflowTemplateColumns.position)
    .all();
  res.json({ ...template, columns: templateColumns });
});

export default router;
