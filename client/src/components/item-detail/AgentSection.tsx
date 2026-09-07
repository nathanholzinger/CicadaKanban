import { useEffect, useState } from 'react';
import type { Agent, Item, ItemDetail } from '../../types';
import { fetchAgents } from '../../api/agents';
import { updateItem } from '../../api/items';
import { DetailSection } from './DetailSection';

interface AgentSectionProps {
  item: ItemDetail;
  onUpdate: (updated: Item) => void;
}

export function AgentSection({ item, onUpdate }: AgentSectionProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(err => console.error('Failed to load agents:', err));
  }, []);

  async function handleAgentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const agentId = e.target.value || null;
    setSaving(true);
    try {
      const updated = await updateItem(item.id, {
        agentId,
        assigneeType: agentId ? 'agent' : null,
      });
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update agent assignment:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenInClaude(agent: Agent) {
    if (agent.surface === 'code') {
      const parts = [`I have a task I'd like your help with:\n\n**${item.title}**`];
      if (item.description) parts.push(item.description);
      await navigator.clipboard.writeText(parts.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    const text = `# ${item.title}${item.description ? `\n\n${item.description}` : ''}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.location.href = `claude://claude.ai/project/${agent.claudeProjectId}`;
  }

  const assignedAgent = item.agentId ? agents.find(a => a.id === item.agentId) : null;

  let claudeButtonLabel = 'Open in Claude';
  if (copied) {
    claudeButtonLabel = 'Copied to clipboard!';
  } else if (assignedAgent?.surface === 'code') {
    claudeButtonLabel = 'Copy Story to Clipboard';
  }

  return (
    <DetailSection label="Agent">
      <select
        value={item.agentId ?? ''}
        onChange={handleAgentChange}
        disabled={saving}
        className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-300 focus:border-blue-500/60 focus:outline-none disabled:opacity-50"
      >
        <option value="">None</option>
        {agents.map(a => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.surface === 'chat' ? 'Claude.ai' : a.surface === 'code' ? 'Claude Code' : 'Co-work'})
          </option>
        ))}
      </select>
      {assignedAgent && (
        <button
          onClick={() => handleOpenInClaude(assignedAgent)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-500"
        >
          {claudeButtonLabel}
          {!copied && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          )}
        </button>
      )}
    </DetailSection>
  );
}
