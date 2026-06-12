import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { getModLogs } from '../../../services/guildApi';
import wsClient from '../../../services/ws';
import { useStore } from '../../../store/useStore';

const actionTypes = ['All', 'Warn', 'Mute', 'Kick', 'Ban', 'Unban', 'Timeout'];

const actionBadgeStyles: Record<string, { bg: string; color: string }> = {
  Warn: { bg: 'rgba(253, 224, 71, 0.12)', color: '#FDE047' },
  Mute: { bg: 'rgba(129, 140, 248, 0.12)', color: '#818CF8' },
  Kick: { bg: 'rgba(253, 224, 71, 0.12)', color: '#FDE047' },
  Ban: { bg: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' },
  Unban: { bg: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' },
  Timeout: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' },
};

export function LogsTab() {
  const [filterType, setFilterType] = useState('All');
  const [searchMod, setSearchMod] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  const { currentGuild } = useStore();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const id = currentGuild?.id || '';
        const res = await getModLogs(id);
        if (!mounted) return;
        setLogs(res.logs || res);
      } catch (err) {
        console.error('Failed to load mod logs', err);
      }
    }
    load();
    // subscribe to ws moderation events and subscribe to guild streams if available
    const off = wsClient.on('moderation', (msg: any) => {
      // server sends { event: 'moderation', payload: { type: 'log', timestamp, data } }
      const payload = msg.payload || msg;
      const data = payload.data || payload;
      setLogs((prev) => [data, ...prev]);
    });

    return () => { mounted = false; off(); };
  }, []);

  const filtered = logs.filter((log) => {
    // Model uses `type` field (not `action`), and values are capitalized: 'Warn', 'Mute', etc.
    const logType = log.type || log.action || '';
    const matchesType = filterType === 'All' || logType.toLowerCase() === filterType.toLowerCase();
    const modName = log.moderatorID || log.moderator || '';
    const matchesMod = !searchMod || String(modName).toLowerCase().includes(searchMod.toLowerCase());
    const targetName = log.userID || log.targetUser || '';
    const matchesTarget = !searchTarget || String(targetName).toLowerCase().includes(searchTarget.toLowerCase());
    return matchesType && matchesMod && matchesTarget;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Moderation Logs</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Read-only view of all moderation actions</p>
      </div>

      <div className="rounded-xl p-4 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              {actionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input type="text" value={searchMod} onChange={(e) => setSearchMod(e.target.value)}
            placeholder="Filter by moderator..."
            className="rounded-lg px-4 py-2 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <input type="text" value={searchTarget} onChange={(e) => setSearchTarget(e.target.value)}
            placeholder="Filter by target user..."
            className="rounded-lg px-4 py-2 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ml-auto"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Case ID</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Action</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Target</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Moderator</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Reason</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const badge = actionBadgeStyles[log.action] || { bg: 'var(--surface-lighter)', color: 'var(--text-muted)' };
                return (
                  <tr key={log.caseId} className="transition-colors hover:bg-[var(--bg-light)]"
                    style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text)' }}>{log.caseId}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: badge.bg, color: badge.color }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{log.targetUser}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{log.moderator}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>{log.reason}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
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
