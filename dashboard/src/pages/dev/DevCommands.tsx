import { useState } from 'react';
import { RefreshCw, Command } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { commandsList, commandStats } from '../../data/mockData';

export function DevCommands() {
  const { showToast } = useStore();
  const [commands] = useState(commandsList);

  const handleReregister = () => {
    showToast('Slash commands re-registered!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Commands</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Registered slash commands and usage stats</p>
        </div>
        <button onClick={handleReregister}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
          <RefreshCw className="w-4 h-4" /> Re-Register Commands
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Command</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Category</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Usage</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Executions</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd) => {
                const stats = commandStats.find((s) => s.name === cmd.name);
                return (
                  <tr key={cmd.name} className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Command className="w-4 h-4" style={{ color: '#38BDF8' }} />
                        <code className="font-mono text-xs rounded px-1.5 py-0.5"
                          style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>/{cmd.name}</code>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cmd.description}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{cmd.category}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs"
                        style={{ background: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' }}>Global</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{cmd.usage}</td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text)' }}>
                      {stats ? stats.count.toLocaleString() : '0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
