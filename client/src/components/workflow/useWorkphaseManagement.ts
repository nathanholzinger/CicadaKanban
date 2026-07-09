import { useState } from 'react';
import type { WorkPhase } from '../../types';
import { createWorkPhase, updateWorkPhase, deleteWorkPhase } from '../../api';

export function useWorkphaseManagement(workflowId: string) {
  const [workphases, setWorkphases] = useState<WorkPhase[]>([]);
  const [addingWorkphase, setAddingWorkphase] = useState(false);
  const [newWorkphaseName, setNewWorkphaseName] = useState('');

  async function handleCreateWorkphase() {
    if (!newWorkphaseName.trim()) return;
    try {
      const workphase = await createWorkPhase({ workflowId, name: newWorkphaseName.trim() });
      setWorkphases(prev => [...prev, workphase]);
      setNewWorkphaseName('');
      setAddingWorkphase(false);
    } catch (err) {
      console.error('Failed to create workphase:', err);
    }
  }

  async function handleRenameWorkphase(id: string, name: string) {
    try {
      const updated = await updateWorkPhase(id, { name });
      setWorkphases(prev => prev.map(w => w.id === id ? { ...w, name: updated.name } : w));
    } catch (err) {
      console.error('Failed to rename workphase:', err);
    }
  }

  async function handleDeleteWorkphase(id: string) {
    await deleteWorkPhase(id);
    setWorkphases(prev => prev.filter(w => w.id !== id));
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
