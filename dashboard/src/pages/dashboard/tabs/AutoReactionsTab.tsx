import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Smile, Play } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { getAutoReactions, createAutoReaction, updateAutoReaction, deleteAutoReaction, getGuildChannels } from '../../../services/guildApi';

export function AutoReactionsTab() {
  const { showToast, currentGuild } = useStore();
  const [rules, setRules] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ channelId: string; emoji: string; triggerType: 'always' | 'pattern'; pattern: string; cooldown: number }>({ channelId: '', emoji: '', triggerType: 'always', pattern: '', cooldown: 0 });
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) return;
      try {
        const [r, chs] = await Promise.all([
          getAutoReactions(currentGuild.id),
          getGuildChannels(currentGuild.id),
        ]);
        if (!mounted) return;
        setRules(r || []);
        setChannels(chs || []);
      } catch (err) {
        console.error('Failed to load auto-reactions', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleSave = async () => {
    if (!currentGuild) return;
    try {
      if (editing) {
        const updated = await updateAutoReaction(currentGuild.id, editing, {
          guildID: currentGuild.id,
          channelID: formData.channelId,
          emojis: formData.emoji ? [{
            name: formData.emoji,
            raw: formData.emoji,
            animated: false,
            isUnicode: true,
          }] : [],
          authorID: currentGuild.id,
          cooldown: formData.cooldown,
          ignoreBots: true,
        });
        setRules(rules.map((r) => (r._id === editing ? updated : r)));
        showToast('Rule updated!', 'success');
      } else {
        const created = await createAutoReaction(currentGuild.id, {
          guildID: currentGuild.id,
          channelID: formData.channelId,
          emojis: formData.emoji ? [{
            name: formData.emoji,
            raw: formData.emoji,
            animated: false,
            isUnicode: true,
          }] : [],
          authorID: currentGuild.id,
          cooldown: formData.cooldown,
          ignoreBots: true,
        });
        setRules([...rules, created]);
        showToast('Rule created!', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ channelId: '', emoji: '', triggerType: 'always', pattern: '', cooldown: 0 });
    } catch (err) {
      console.error(err);
      showToast('Failed to save rule', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentGuild) return;
    try {
      await deleteAutoReaction(currentGuild.id, id);
      setRules(rules.filter((r) => r._id !== id));
      showToast('Rule deleted!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete rule', 'error');
    }
  };

  const getChannelName = (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    return ch ? ch.name : 'unknown';
  };

  const testRules = () => {
    if (!testMessage) return [];
    return rules.filter((r) => {
      if (r.triggerType === 'always') return true;
      try {
        const regex = new RegExp(r.pattern, 'i');
        return regex.test(testMessage);
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Auto-Reactions</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Automatically react to messages with emoji</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setFormData({ channelId: '', emoji: '', triggerType: 'always', pattern: '', cooldown: 0 }); }}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{editing ? 'Edit' : 'New'} Rule</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Channel</label>
              <select
                value={formData.channelId}
                onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">All channels</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>#{ch.name}</option>
                ))}
              </select>
              {formData.channelId === '' && (
                <p className="text-xs mt-1" style={{ color: '#86EFAC' }}>Will react in all channels</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Emoji</label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="😂 or :emoji_name:"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Trigger Mode</label>
            <div className="flex gap-3">
              {(['always', 'pattern'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFormData({ ...formData, triggerType: mode })}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: formData.triggerType === mode ? 'linear-gradient(135deg, #38BDF8, #818CF8)' : 'var(--bg)',
                    color: formData.triggerType === mode ? 'white' : 'var(--text-muted)',
                    border: formData.triggerType === mode ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {mode === 'always' ? 'All Messages' : 'Pattern Match'}
                </button>
              ))}
            </div>
          </div>
          {formData.triggerType === 'pattern' && (
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Regex Pattern</label>
              <input
                type="text"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none font-mono"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="e.g. spotify|youtube|soundcloud"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Cooldown: {formData.cooldown}s</label>
            <input
              type="range"
              min={0}
              max={3600}
              step={30}
              value={formData.cooldown}
              onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) })}
              className="w-full"
              style={{ accentColor: '#38BDF8' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Channel</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Emoji</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Trigger</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Cooldown</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule._id} className="transition-colors hover:bg-[var(--bg-light)]"
                style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>#{getChannelName(rule.channelID)}</td>
                <td className="px-4 py-3 text-lg">{(rule.emojis && rule.emojis[0] && rule.emojis[0].raw) || rule.emoji || '😀'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {rule.triggerType === 'always' ? 'All messages' : `Pattern: ${rule.pattern}`}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{rule.cooldown}s</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditing(rule._id); setFormData({ channelId: rule.channelID, emoji: (rule.emojis && rule.emojis[0] && rule.emojis[0].raw) || '', triggerType: 'always', pattern: '', cooldown: rule.cooldown || 0 }); setShowForm(true); }}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Play className="w-4 h-4" style={{ color: '#38BDF8' }} /> Live Pattern Tester
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        {testMessage && (
          <div className="mt-3 flex flex-wrap gap-2">
            {testRules().length > 0 ? (
              testRules().map((rule) => (
                <span key={rule._id} className="px-2 py-1 text-xs rounded-md flex items-center gap-1"
                  style={{ background: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' }}>
                  <Smile className="w-3 h-3" /> Would react with {rule.emoji} in #{rule.channelName}
                </span>
              ))
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No rules would trigger for this message</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
