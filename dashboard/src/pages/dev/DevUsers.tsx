import { useState } from 'react';
import { Search, Shield, UserX, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { devUsers } from '../../data/mockData';

export function DevUsers() {
  const { showToast } = useStore();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(devUsers);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

  const toggleRole = (id: string) => {
    setUsers(users.map((u) =>
      u.id === id ? { ...u, role: u.role === 'Developer' ? 'User' : 'Developer' } : u
    ));
    showToast('User role updated!', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Users</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Dashboard users and their permissions</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or ID..."
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Guilds Managed</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Last Login</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
                        {u.username[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{u.username}</div>
                        <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{u.guildsManaged}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.lastLogin).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: u.role === 'Developer' ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-lighter)', color: u.role === 'Developer' ? '#38BDF8' : 'var(--text-muted)' }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleRole(u.id)}
                        className="p-1.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        {u.role === 'Developer' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setUsers(users.filter((user) => user.id !== u.id)); showToast('Access revoked!', 'warning'); }}
                        className="p-1.5 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
