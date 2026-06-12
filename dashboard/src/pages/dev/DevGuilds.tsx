import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, LogOut, Download } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { mockGuilds } from '../../data/mockData';

export function DevGuilds() {
  const { showToast } = useStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);

  const filtered = mockGuilds
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.id.includes(search))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'members') return b.memberCount - a.memberCount;
      return 0;
    });

  const guild = mockGuilds.find((g) => g.id === selectedGuild);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Guilds</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All servers the bot is in</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="name">Sort by Name</option>
          <option value="members">Sort by Members</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Guild</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Members</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Owner ID</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Features</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} onClick={() => setSelectedGuild(selectedGuild === g.id ? null : g.id)}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={g.icon} alt="" className="w-8 h-8 rounded-lg" />
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.name}</div>
                        <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{g.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{g.memberCount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{g.ownerId}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {g.features.slice(0, 3).map((f: string) => (
                        <span key={f} className="px-1.5 py-0.5 text-[10px] rounded"
                          style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); showToast('Config reloaded!', 'success'); }}
                        className="p-1.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); showToast('Left guild!', 'warning'); }}
                        className="p-1.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {guild && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>{guild.name}</h3>
            <button onClick={() => setSelectedGuild(null)} className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>Close</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div><span style={{ color: 'var(--text-muted)' }}>Members:</span> <span style={{ color: 'var(--text)' }}>{guild.memberCount.toLocaleString()}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Channels:</span> <span style={{ color: 'var(--text)' }}>{guild.channelCount}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Roles:</span> <span style={{ color: 'var(--text)' }}>{guild.roleCount}</span></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
