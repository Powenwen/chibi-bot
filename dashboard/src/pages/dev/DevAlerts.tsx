import { useState } from 'react';
import { Plus, Trash2, Bell, Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { alertRules, alertHistory } from '../../data/mockData';

export function DevAlerts() {
  const { showToast } = useStore();
  const [rules, setRules] = useState(alertRules);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ condition: '', target: '', enabled: true });

  const handleAdd = () => {
    setRules([...rules, { id: `a${Date.now()}`, ...formData }]);
    setShowForm(false);
    setFormData({ condition: '', target: '', enabled: true });
    showToast('Alert rule created!', 'success');
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    showToast('Rule deleted!', 'success');
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Alerts</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure alert rules and view history</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>New Alert Rule</h3>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Condition</label>
            <input type="text" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              placeholder="e.g. Error rate > 5%" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Notification Target</label>
            <input type="text" value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              placeholder="Discord Webhook URL" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>Add Rule</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl p-5 flex items-center justify-between gap-4 transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <div className="flex items-center gap-3 flex-1">
              <Bell className="w-5 h-5" style={{ color: rule.enabled ? '#38BDF8' : 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{rule.condition}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{rule.target}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleRule(rule.id)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ background: rule.enabled ? '#38BDF8' : 'var(--surface-lighter)' }}>
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  style={{ transform: rule.enabled ? 'translateX(24px)' : 'translateX(4px)' }} />
              </button>
              <button onClick={() => showToast('Test alert sent!', 'success')}
                className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <Play className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(rule.id)}
                className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Alert History</h3>
        <div className="space-y-2">
          {alertHistory.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: h.sent ? '#86EFAC' : '#FCA5A5' }} />
                <div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{h.rule}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <span className="text-xs font-medium" style={{ color: h.sent ? '#86EFAC' : '#FCA5A5' }}>
                {h.sent ? 'Sent' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
