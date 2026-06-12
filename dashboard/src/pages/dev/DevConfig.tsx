import { useState } from 'react';
import { Save, Wrench } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function DevConfig() {
  const { showToast } = useStore();
  const [config, setConfig] = useState({
    activities: ['Playing with {guilds} servers', 'Helping {users} users', 'c!help for commands'],
    errorThreshold: 5,
    healthCheckInterval: 30,
    messageCacheTTL: 300,
    userCacheTTL: 600,
    maintenanceMode: false,
  });

  const handleSave = () => {
    showToast('Global configuration saved!', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Configuration</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Global bot settings and feature flags</p>
      </div>

      <div className="rounded-xl p-6 space-y-6 max-w-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Bot Activities (one per line)</label>
          <textarea
            value={config.activities.join('\n')}
            onChange={(e) => setConfig({ ...config, activities: e.target.value.split('\n').filter(Boolean) })}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none h-24"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Use {'{guilds}'}, {'{users}'}, {'{commands}'} as variables</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Error Threshold (%)', key: 'errorThreshold' as const },
            { label: 'Health Check Interval (s)', key: 'healthCheckInterval' as const },
            { label: 'Message Cache TTL (s)', key: 'messageCacheTTL' as const },
            { label: 'User Cache TTL (s)', key: 'userCacheTTL' as const },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>{field.label}</label>
              <input
                type="number"
                value={config[field.key]}
                onChange={(e) => setConfig({ ...config, [field.key]: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          ))}
        </div>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(253, 224, 71, 0.1)' }}>
                <Wrench className="w-5 h-5" style={{ color: '#FDE047' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Maintenance Mode</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Disable config edits and show maintenance banner</div>
              </div>
            </div>
            <button onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ background: config.maintenanceMode ? '#FDE047' : 'var(--surface-lighter)' }}>
              <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: config.maintenanceMode ? 'translateX(26px)' : 'translateX(4px)' }} />
            </button>
          </label>
        </div>

        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
}
