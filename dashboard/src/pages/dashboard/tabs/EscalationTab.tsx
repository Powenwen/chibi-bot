import { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { getEscalationRules, addEscalationRule, deleteEscalationRule } from '../../../services/guildApi';

export function EscalationTab() {
  const { showToast, currentGuild } = useStore();
  const [rules, setRules] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ warningCount: number; action: 'mute' | 'kick' | 'ban' | 'notify'; duration: string; resetWarnings: boolean }>({ warningCount: 3, action: 'mute', duration: '1h', resetWarnings: false });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) return;
      try {
        const res = await getEscalationRules(currentGuild.id);
        if (!mounted) return;
        setRules(res?.rules || []);
      } catch (err) {
        console.error('Failed to load escalation rules', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleAdd = async () => {
    if (!currentGuild) return;
    try {
      const res = await addEscalationRule(currentGuild.id, {
        warningCount: formData.warningCount,
        action: formData.action === 'notify' ? 'timeout' : formData.action,
        duration: formData.action === 'mute' || formData.action === 'ban' ? undefined : undefined,
        reason: `Auto-escalation at ${formData.warningCount} warnings`,
      });
      setRules(res?.rules || []);
      setShowForm(false);
      setFormData({ warningCount: 3, action: 'mute', duration: '1h', resetWarnings: false });
      showToast('Escalation rule added!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to add rule', 'error');
    }
  };

  const handleDelete = async (index: number) => {
    if (!currentGuild) return;
    try {
      const res = await deleteEscalationRule(currentGuild.id, index);
      setRules(res?.rules || []);
      showToast('Rule deleted!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete rule', 'error');
    }
  };

  const actionColors: Record<string, string> = {
    ban: '#FCA5A5',
    kick: '#FDE047',
    mute: '#818CF8',
    notify: '#86EFAC',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Warning Escalation</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Automatic actions based on warning count</p>
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
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>New Escalation Rule</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Warning Count</label>
              <input type="number" value={formData.warningCount} min={1}
                onChange={(e) => setFormData({ ...formData, warningCount: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Action</label>
              <select value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as 'mute' | 'kick' | 'ban' | 'notify' })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <option value="mute">Mute</option>
                <option value="kick">Kick</option>
                <option value="ban">Ban</option>
                <option value="notify">Notify</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Duration</label>
              <input type="text" value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="e.g. 1h, 1d" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.resetWarnings}
                  onChange={(e) => setFormData({ ...formData, resetWarnings: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#38BDF8]" />
                <span className="text-sm" style={{ color: 'var(--text)' }}>Reset warnings after</span>
              </label>
            </div>
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
        {rules.map((rule, index) => (
          <div key={index} className="rounded-xl p-4 flex items-center gap-4 transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <GripVertical className="w-4 h-4 cursor-grab" style={{ color: 'var(--text-muted)' }} />
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text)' }}>At <strong>{rule.warningCount}</strong> warnings</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: `${actionColors[rule.action]}15`, color: actionColors[rule.action] }}>
                  {rule.action}
                </span>
                {rule.duration && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>for {rule.duration}</span>}
                {rule.resetWarnings && <span className="text-xs" style={{ color: '#86EFAC' }}>(resets warnings)</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(index)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'rgba(252, 165, 165, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
