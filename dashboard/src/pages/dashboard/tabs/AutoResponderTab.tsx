import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { getAutoResponders, createAutoResponder, updateAutoResponder, deleteAutoResponder, getGuildChannels } from '../../../services/guildApi';
import { EmbedBuilder } from '../../../components/ui/EmbedBuilder';

export function AutoResponderTab() {
  const { showToast, currentGuild } = useStore();
  const [responders, setResponders] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    trigger: '', matchMode: 'exact', caseSensitive: false,
    responseText: '', useEmbed: false, channels: [], cooldown: 30,
    embedTitle: '', embedDescription: '', embedColor: '#38BDF8', embedFooter: '',
  });


  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) return;
      try {
        const [r, chs] = await Promise.all([
          getAutoResponders(currentGuild.id),
          getGuildChannels(currentGuild.id),
        ]);
        if (!mounted) return;
        setResponders(r || []);
        setChannels(chs || []);
      } catch (err) {
        console.error('Failed to load auto-responders', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleSave = async () => {
    if (!currentGuild) return;
    try {
      const payload = {
        guildID: currentGuild.id,
        channelID: formData.channels[0] || '',
        trigger: formData.trigger,
        response: formData.useEmbed ? (formData.embedDescription || formData.responseText) : formData.responseText,
        authorID: currentGuild.id,
        caseSensitive: formData.caseSensitive,
        exactMatch: formData.matchMode === 'exact',
        useRegex: formData.matchMode === 'regex',
        useEmbed: formData.useEmbed,
        embedTitle: formData.embedTitle || '',
        embedColor: formData.embedColor || '#38BDF8',
        cooldown: formData.cooldown,
        responseDelay: 0,
        suppressMentions: false,
      };
      if (editing) {
        const updated = await updateAutoResponder(currentGuild.id, editing, payload);
        setResponders(responders.map((r) => (r._id === editing ? updated : r)));
        showToast('Responder updated!', 'success');
      } else {
        const created = await createAutoResponder(currentGuild.id, payload);
        setResponders([...responders, created]);
        showToast('Responder created!', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setStep(1);
      setFormData({ trigger: '', matchMode: 'exact', caseSensitive: false, responseText: '', useEmbed: false, channels: [], cooldown: 30, embedTitle: '', embedDescription: '', embedColor: '#38BDF8', embedFooter: '' });
    } catch (err) {
      console.error(err);
      showToast('Failed to save responder', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentGuild) return;
    try {
      await deleteAutoResponder(currentGuild.id, id);
      setResponders(responders.filter((r) => r._id !== id));
      showToast('Responder deleted!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete responder', 'error');
    }
  };

  const stepBtn = (s: number, label: string) => (
    <div key={s} className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        style={{ background: step >= s ? 'linear-gradient(135deg, #38BDF8, #818CF8)' : 'var(--surface-lighter)', color: step >= s ? 'white' : 'var(--text-muted)' }}>
        {s}
      </div>
      <span className="text-xs" style={{ color: step >= s ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Auto-Responder</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Keyword-triggered automatic replies</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setStep(1); setFormData({ trigger: '', matchMode: 'exact', caseSensitive: false, responseText: '', useEmbed: false, channels: [], cooldown: 30, embedTitle: '', embedDescription: '', embedColor: '#38BDF8', embedFooter: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
          <Plus className="w-4 h-4" /> Add Responder
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            {stepBtn(1, 'Trigger')}
            {stepBtn(2, 'Response')}
            {stepBtn(3, 'Scope')}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Trigger Phrase</label>
                <input type="text" value={formData.trigger} onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="e.g. help, rules, hello" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Match Mode</label>
                <select value={formData.matchMode} onChange={(e) => setFormData({ ...formData, matchMode: e.target.value })}
                  className="w-full max-w-xs rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <option value="exact">Exact Match</option>
                  <option value="contains">Contains</option>
                  <option value="regex">Regex</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.caseSensitive} onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                  className="w-4 h-4 rounded" style={{ accentColor: '#38BDF8' }} />
                <span className="text-sm" style={{ color: 'var(--text)' }}>Case Sensitive</span>
              </label>
              <button onClick={() => setStep(2)} className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>Next</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.useEmbed} onChange={(e) => setFormData({ ...formData, useEmbed: e.target.checked })}
                  className="w-4 h-4 rounded" style={{ accentColor: '#38BDF8' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Use embed for response</span>
              </label>

              {formData.useEmbed ? (
                <EmbedBuilder
                  initialTitle={formData.embedTitle}
                  initialDescription={formData.embedDescription || formData.responseText}
                  initialColor={formData.embedColor}
                  initialFooter={formData.embedFooter}
                  onChange={(embed: any) => setFormData({ ...formData, embedTitle: embed.title, embedDescription: embed.description, embedColor: embed.color, embedFooter: embed.footer })}
                />
              ) : (
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Response Text</label>
                  <textarea value={formData.responseText} onChange={(e) => setFormData({ ...formData, responseText: e.target.value })}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none h-24"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    placeholder="Enter response message..." />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>Back</button>
                <button onClick={() => setStep(3)} className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Channel Scope</label>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Leave empty to respond in all channels, or select specific channels.</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {channels.map((ch: any) => (
                    <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.channels.includes(ch.id)}
                        onChange={() => {
                          const nc = formData.channels.includes(ch.id) ? formData.channels.filter((c: string) => c !== ch.id) : [...formData.channels, ch.id];
                          setFormData({ ...formData, channels: nc });
                        }}
                        className="w-4 h-4 rounded" style={{ accentColor: '#38BDF8' }} />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>#{ch.name}</span>
                    </label>
                  ))}
                </div>
                {formData.channels.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#86EFAC' }}>All channels</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Cooldown: {formData.cooldown}s</label>
                <input type="range" min={0} max={300} step={5} value={formData.cooldown}
                  onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) })}
                  className="w-full" style={{ accentColor: '#38BDF8' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>Back</button>
                <button onClick={handleSave} className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Trigger</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Match</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Response</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Cooldown</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {responders.map((resp: any) => (
              <tr key={resp._id} className="transition-colors hover:bg-[var(--bg-light)]"
                style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text)' }}>{resp.trigger}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{resp.matchMode || (resp.exactMatch ? 'exact' : resp.useRegex ? 'regex' : 'contains')}{resp.caseSensitive ? ' (case)' : ''}</td>
                <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>{resp.response}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{resp.cooldown}s</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditing(resp._id); setFormData({ trigger: resp.trigger, matchMode: resp.matchMode || (resp.exactMatch ? 'exact' : resp.useRegex ? 'regex' : 'contains'), caseSensitive: resp.caseSensitive, responseText: resp.response, useEmbed: resp.useEmbed || false, channels: resp.channelID ? [resp.channelID] : [], cooldown: resp.cooldown, embedTitle: resp.embedTitle || '', embedDescription: resp.embedDescription || '', embedColor: resp.embedColor || '#38BDF8', embedFooter: '' }); setStep(1); setShowForm(true); }}
                      className="p-1.5 rounded transition-colors" style={{ color: 'var(' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(resp._id)}
                      className="p-1.5 rounded transition-colors" style={{ color: 'var(' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}

