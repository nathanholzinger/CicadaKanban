import { Fragment } from 'react';
import type { Project } from '../types';

interface ProjectPageProps {
  project: Project;
  ancestors: Project[];
  subprojects: Project[];
  onSelectProject: (id: string) => void;
}

export default function ProjectPage({ project, ancestors, subprojects, onSelectProject }: ProjectPageProps) {
  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      {ancestors.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
          {ancestors.map(a => (
            <Fragment key={a.id}>
              <button
                onClick={() => onSelectProject(a.id)}
                className="hover:text-zinc-300 transition-colors"
              >
                {a.name}
              </button>
              <span>/</span>
            </Fragment>
          ))}
          <span className="text-zinc-400">{project.name}</span>
        </nav>
      )}

      {/* Header */}
      <h1 className="text-2xl font-semibold text-zinc-100 mb-1">{project.name}</h1>
      {project.description && (
        <p className="text-sm text-zinc-400 mb-6">{project.description}</p>
      )}

      {/* Subprojects */}
      {subprojects.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Subprojects
          </h2>
          <ul className="space-y-1">
            {subprojects.map(child => (
              <li key={child.id}>
                <button
                  onClick={() => onSelectProject(child.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  {child.name}
                  {child.description && (
                    <span className="ml-2 text-xs text-zinc-600">{child.description}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
