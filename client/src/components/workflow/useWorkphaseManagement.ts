// Workphase CRUD + reorder state for BoardView.

import { useState } from 'react';
import type { Workphase } from '../../types';
import { createWorkphase, updateWorkphase, deleteWorkphase } from '../../api/workphases';

export function useWorkphaseManagement(workflowId: string) {
  const [workphases, setWorkphases] = useState<Workphase[]>([]);
  const [addingWorkphase, setAddingWorkphase] = useState(false);
  const [newWorkphaseName, setNewWorkphaseName] = useState('');

  async function handleCreateWorkphase() {
    if (!newWorkphaseName.trim()) return;
    try {
      const workphase = await createWorkphase({ workflowId, name: newWorkphaseName.trim() });
      setWorkphases(prev => [...prev, workphase]);
      setNewWorkphaseName('');
      setAddingWorkphase(false);
    } catch (err) {
      console.error('Failed to create workphase:', err);
    }
  }

  async function handleRenameWorkphase(id: string, name: string) {
    try {
      const updated = await updateWorkphase(id, { name });
      setWorkphases(prev => prev.map(w => (w.id === id ? { ...w, name: updated.name } : w)));
    } catch (err) {
      console.error('Failed to rename workphase:', err);
    }
  }

  async function handleDeleteWorkphase(id: string) {
    const result = await deleteWorkphase(id);
    setWorkphases(prev => prev.filter(w => w.id !== id));
    return result;
  }

  return {
    workphases,
    setWorkphases,
    addingWorkphase,
    setAddingWorkphase,
    newWorkphaseName,
    setNewWorkphaseName,
    handleCreateWorkphase,
    handleRenameWorkphase,
    handleDeleteWorkphase,
  };
}
