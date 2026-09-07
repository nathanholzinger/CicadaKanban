import { useEffect, useRef, useState } from 'react';
import ModalShell from './ModalShell';
import { BTN_MODAL_CANCEL, BTN_MODAL_PRIMARY, INPUT_LG_RING } from './item-detail/pillUtils';

interface CreateProjectModalProps {
  parentName?: string;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export default function CreateProjectModal({ parentName, onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreate(name.trim(), description.trim());
      onClose();
    } catch {
      setError('Failed to create project. Please try again.');
      setSaving(false);
    }
  }

  const isSubproject = !!parentName;

  return (
    <ModalShell
      onClose={onClose}
      ariaLabel={isSubproject ? 'New subproject' : 'New project'}
      title={isSubproject ? 'New subproject' : 'New project'}
      subtitle={
        isSubproject ? (
          <>
            Under <span className="text-zinc-400">{parentName}</span>
          </>
        ) : undefined
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 pt-4 pb-6">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Name</label>
          <input
            ref={nameInputRef}
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={isSubproject ? 'Subproject name' : 'Project name'}
            className={`w-full ${INPUT_LG_RING}`}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">
            Description <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this project for?"
            className={`w-full ${INPUT_LG_RING}`}
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className={BTN_MODAL_CANCEL}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={BTN_MODAL_PRIMARY}
          >
            {saving ? 'Creating…' : isSubproject ? 'Create subproject' : 'Create project'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
