import { useState } from 'react';
import { AlertTriangle, Trash2, ExternalLink } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

export function SettingsTab() {
  const { showToast, currentGuild } = useStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [authUsers, setAuthUsers] = useState(['222222222222222222']);
  const [newUserId, setNewUserId] = useState('');
  const [features, setFeatures] = useState({
    welcome: true,
    sticky: true,
    autoreactions: true,
    healthchecks: true,
  });

  const handleAddUser = () => {
    if (!newUserId) return;
    setAuthUsers([...authUsers, newUserId]);
    setNewUserId('');
    showToast('Authorized user added!', 'success');
  };

  const handleRemoveUser = (id: string) => {
    setAuthUsers(authUsers.filter((u) => u !== id));
    showToast('User removed!', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Server Settings</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage guild-wide configuration</p>
      </div>

      <div className="rounded-xl p-6 space-y-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Command Prefix</label>
          <div className="flex items-center gap-3">
            <code className="px-3 py-2 rounded-lg font-mono text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: '#38BDF8' }}>/</code>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Slash commands — no prefix needed</span>
          </div>
        </div>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Authorized Users</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Users with elevated dashboard permissions beyond Discord roles</p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={newUserId} onChange={(e) => setNewUserId(e.target.value)}
              placeholder="Discord User ID"
              className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <button onClick={handleAddUser}
              className="px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>Add</button>
          </div>
          <div className="space-y-2">
            {authUsers.map((id) => (
              <div key={id} className="flex items-center justify-between rounded-lg px-4 py-2.5"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <code className="text-xs font-mono" style={{ color: 'var(--text)' }}>{id}</code>
                <button onClick={() => handleRemoveUser(id)}
                  className="p-1 transition-colors" style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Feature Flags</h3>
          <div className="space-y-3">
            {Object.entries(features).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm capitalize" style={{ color: 'var(--text)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <button onClick={() => setFeatures({ ...features, [key]: !enabled })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ background: enabled ? '#38BDF8' : 'var(--surface-lighter)' }}>
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: enabled ? 'translateX(24px)' : 'translateX(4px)' }} />
                </button>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#FCA5A5' }}>
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg p-4"
              style={{ background: 'rgba(252, 165, 165, 0.05)', border: '1px solid rgba(252, 165, 165, 0.2)' }}>
              <div>
                <div className="text-sm font-medium" style={{ color: '#FCA5A5' }}>Reset All Settings</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>This will reset all configuration to defaults</div>
              </div>
              <button onClick={() => setShowResetModal(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' }}>Reset</button>
            </div>
            <div className="flex items-center justify-between rounded-lg p-4"
              style={{ background: 'rgba(252, 165, 165, 0.05)', border: '1px solid rgba(252, 165, 165, 0.2)' }}>
              <div>
                <div className="text-sm font-medium" style={{ color: '#FCA5A5' }}>Remove Bot from Server</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>This will kick the bot from your server</div>
              </div>
              <a href={`https://discord.com/channels/${currentGuild?.id}/integrations`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                style={{ background: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' }}>
                <ExternalLink className="w-3.5 h-3.5" /> Manage
              </a>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => { showToast('All settings reset!', 'success'); setShowResetModal(false); }}
        title="Reset All Settings"
        description="This will permanently reset all bot configuration for this server to defaults. This action cannot be undone."
        confirmText="Reset Everything"
        confirmVariant="danger"
        requireText={currentGuild?.name || 'confirm'}
      />
    </div>
  );
}
