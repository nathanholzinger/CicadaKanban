import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => { nameInputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-base font-semibold text-zinc-100">
            {isSubproject ? 'New subproject' : 'New project'}
          </h2>
          {isSubproject && (
            <p className="text-xs text-zinc-500 mt-0.5">
              Under <span className="text-zinc-400">{parentName}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Name</label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder={isSubproject ? 'Subproject name' : 'Project name'}
              className="
                w-full px-3 py-2 rounded-lg text-sm
                bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20
              "
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
              className="
                w-full px-3 py-2 rounded-lg text-sm
                bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500
                focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20
              "
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : isSubproject ? 'Create subproject' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
