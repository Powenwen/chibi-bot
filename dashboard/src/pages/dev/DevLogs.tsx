import { useState } from 'react';
import { Download, Filter } from 'lucide-react';

const logLevels = ['All', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
const modules = ['All', 'auto-reaction', 'moderation', 'welcome', 'sticky', 'suggestions', 'automod'];

const mockLogs = Array.from({ length: 20 }, (_, i) => ({
  timestamp: new Date(Date.now() - i * 60000).toISOString(),
  level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][Math.floor(Math.random() * 4)],
  module: modules[Math.floor(Math.random() * (modules.length - 1)) + 1],
  message: [
    'Processed auto-reaction rule for channel #general',
    'User warned: ToxicPlayer (Case C-1042)',
    'Welcome message sent to #welcome for NewUser',
    'Sticky message updated in #rules',
    'Suggestion #42 approved by AdminUser',
    'Auto-mod triggered: spam detected from SpammerBot',
    'Guild config reloaded for Gaming Central',
    'Discord API rate limit hit, backing off...',
  ][Math.floor(Math.random() * 8)],
}));

const levelColors: Record<string, string> = {
  INFO: '#86EFAC',
  WARN: '#FDE047',
  ERROR: '#FCA5A5',
  DEBUG: 'var(--text-muted)',
};

export function DevLogs() {
  const [levelFilter, setLevelFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = mockLogs.filter((log) => {
    const matchesLevel = levelFilter === 'All' || log.level === levelFilter;
    const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;
    const matchesSearch = !search || log.message.toLowerCase().includes(search.toLowerCase());
    return matchesLevel && matchesModule && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Logs</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time log stream from the bot</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <Download className="w-4 h-4" /> Download
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {logLevels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-lg px-4 py-2 text-sm focus:outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs..."
          className="rounded-lg px-4 py-2 text-sm focus:outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10"
              style={{ background: 'var(--surface)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Timestamp</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Level</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Module</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={i} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-bold" style={{ color: levelColors[log.level] }}>{log.level}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{log.module}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text)' }}>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
