import { useRef, useState } from 'react';
import type { Project } from '../types';
import type { UpdateProjectInput } from '../api/projects';
import ConfirmDeleteInline from './ConfirmDeleteInline';
import { buildParentOptions } from '../lib/hierarchy';
import { TrashIcon, PlusIcon, ICON_BUTTON_SM } from './icons';

interface ProjectOverviewTabProps {
  project: Project;
  allProjects: Project[];
  subprojects: Project[];
  onSelectProject: (id: string) => void;
  onUpdate: (id: string, data: UpdateProjectInput) => Promise<void>;
  onCreateSubproject: (parentId: string) => void;
  onDeleteSubproject: (id: string) => Promise<void>;
}

// The Overview tab's own concerns, split out of ProjectPage.tsx (audit
// Finding #31): description edit-in-place, the parent-project selector, and
// the subprojects list with its own delete confirmation. ProjectPage.tsx
// renders this keyed on project.id, so switching projects resets all of
// this component's state by remounting rather than an explicit reset
// effect — same convention as ConfirmDeleteInline (Finding #26). One
// side effect worth noting: an in-progress, unsaved description edit no
// longer survives switching to the Board tab and back (it previously did,
// since ProjectPage.tsx never unmounted this content, just hid it) — a
// minor, arguably more correct behavior change from the plain unmount.
export function ProjectOverviewTab({
  project,
  allProjects,
  subprojects,
  onSelectProject,
  onUpdate,
  onCreateSubproject,
  onDeleteSubproject,
}: ProjectOverviewTabProps) {
  const [editingDescription, setEditingDescription] = useState(false);
  const [descValue, setDescValue] = useState(project.description ?? '');
  const cancelRef = useRef(false);
  const [savingParent, setSavingParent] = useState(false);

  async function handleSaveDescription() {
    const trimmed = descValue.trim() || null;
    if (trimmed !== project.description) {
      await onUpdate(project.id, { description: trimmed });
    }
    setEditingDescription(false);
  }

  function cancelDescriptionEdit() {
    cancelRef.current = true;
    setDescValue(project.description ?? '');
    setEditingDescription(false);
  }

  function handleDescriptionBlur() {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    handleSaveDescription();
  }

  // Escape cancels; Enter is left alone (it's a multi-line textarea — Enter
  // inserts a newline, matching ProjectPage.tsx's own name field being the
  // only one of the two that saves on Enter).
  function handleDescriptionKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') cancelDescriptionEdit();
  }

  return (
    <div className="max-w-2xl overflow-y-auto pt-5">
      {/* Description */}
      {editingDescription ? (
        <textarea
          autoFocus
          value={descValue}
          onChange={e => setDescValue(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={handleDescriptionKeyDown}
          rows={3}
          className="mb-6 w-full resize-none border-b border-zinc-600 bg-transparent text-sm text-zinc-400 focus:border-blue-500/60 focus:outline-none"
        />
      ) : project.description ? (
        <p
          onClick={() => setEditingDescription(true)}
          className="mb-6 cursor-text text-sm whitespace-pre-wrap text-zinc-400 transition-colors hover:text-zinc-300"
        >
          {project.description}
        </p>
      ) : (
        <button
          onClick={() => setEditingDescription(true)}
          className="mb-6 block text-sm text-zinc-600 transition-colors hover:text-zinc-400"
        >
          Add description
        </button>
      )}

      {/* Parent project */}
      <div className="mt-4 mb-6 flex items-center gap-3">
        <span className="w-14 shrink-0 text-xs font-semibold tracking-widest text-zinc-600 uppercase">Parent</span>
        <select
          value={project.parentId ?? ''}
          disabled={savingParent}
          onChange={async e => {
            const newParentId = e.target.value || null;
            setSavingParent(true);
            try {
              await onUpdate(project.id, { parentId: newParentId });
            } finally {
              setSavingParent(false);
            }
          }}
          className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-400 transition-opacity focus:border-zinc-600 focus:outline-none disabled:opacity-50"
        >
          {buildParentOptions(allProjects, project.id, p => p.name, 'Root', true).map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subprojects */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Subprojects</h2>
          <button onClick={() => onCreateSubproject(project.id)} className={ICON_BUTTON_SM} title="Add subproject">
            <PlusIcon />
          </button>
        </div>
        <ul className="space-y-1">
          {subprojects.map(child => (
            <li key={child.id} className="group flex items-center gap-1">
              <ConfirmDeleteInline
                trigger={confirm => (
                  <>
                    <button
                      onClick={() => onSelectProject(child.id)}
                      className="flex-1 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      {child.name}
                      {child.description && <span className="ml-2 text-xs text-zinc-600">{child.description}</span>}
                    </button>
                    <button
                      onClick={confirm}
                      className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-800 hover:text-red-400"
                      title="Delete subproject"
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
                prompt={<span className="flex-1 text-zinc-400">Delete "{child.name}"?</span>}
                onDelete={() => onDeleteSubproject(child.id)}
                className="flex flex-1 items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                deletingClassName="flex-1 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-400"
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
