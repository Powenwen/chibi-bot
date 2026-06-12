import { useEffect, useState } from 'react';
import { Shield, Save } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { getAutoModConfig, updateAutoModConfig, getGuildChannels, getGuildRoles, type AutoModConfig } from '../../../services/guildApi';

interface FlatConfig {
  antiSpamEnabled: boolean;
  spamThreshold: number;
  spamWindow: number;
  spamAction: string;
  spamMuteDuration: string;
  wordFilterEnabled: boolean;
  blockedWords: string;
  exemptRoles: string[];
  exemptChannels: string[];
  raidEnabled: boolean;
  raidThreshold: number;
  raidWindow: number;
  raidAction: string;
}

function toFlat(cfg: AutoModConfig | null): FlatConfig {
  if (!cfg) {
    return {
      antiSpamEnabled: true, spamThreshold: 5, spamWindow: 10, spamAction: 'mute', spamMuteDuration: '5',
      wordFilterEnabled: false, blockedWords: '', exemptRoles: [], exemptChannels: [],
      raidEnabled: true, raidThreshold: 5, raidWindow: 60, raidAction: 'kick',
    };
  }
  return {
    antiSpamEnabled: cfg.antiSpam?.enabled ?? true,
    spamThreshold: cfg.antiSpam?.maxMessages ?? 5,
    spamWindow: cfg.antiSpam?.timeWindow ?? 10,
    spamAction: cfg.antiSpam?.muteTime ? 'mute' : 'kick',
    spamMuteDuration: String(cfg.antiSpam?.muteTime ?? 5),
    wordFilterEnabled: cfg.wordFilter?.enabled ?? false,
    blockedWords: (cfg.wordFilter?.words ?? []).join('\n'),
    exemptRoles: cfg.antiSpam?.ignoreRoles ?? [],
    exemptChannels: cfg.antiSpam?.ignoreChannels ?? [],
    raidEnabled: cfg.raidProtection?.enabled ?? true,
    raidThreshold: cfg.raidProtection?.joinThreshold ?? 5,
    raidWindow: cfg.raidProtection?.timeWindow ?? 60,
    raidAction: cfg.raidProtection?.action ?? 'kick',
  };
}

function toApi(flat: FlatConfig): Partial<AutoModConfig> {
  return {
    antiSpam: {
      enabled: flat.antiSpamEnabled,
      maxMessages: flat.spamThreshold,
      timeWindow: flat.spamWindow,
      muteTime: flat.spamAction === 'mute' ? parseInt(flat.spamMuteDuration) || 5 : 5,
      ignoreRoles: flat.exemptRoles,
      ignoreChannels: flat.exemptChannels,
    },
    wordFilter: {
      enabled: flat.wordFilterEnabled,
      words: flat.blockedWords.split('\n').filter(Boolean),
      action: 'delete' as const,
      whitelist: [],
    },
    linkFilter: {
      enabled: false,
      allowedDomains: [],
      action: 'delete' as const,
      bypassRoles: [],
    },
    raidProtection: {
      enabled: flat.raidEnabled,
      joinThreshold: flat.raidThreshold,
      timeWindow: flat.raidWindow,
      action: flat.raidAction as 'kick' | 'ban',
      lockdownTime: 5,
    },
    duplicateFilter: {
      enabled: false,
      maxDuplicates: 3,
      timeWindow: 10,
      action: 'delete' as const,
    },
    caps: {
      enabled: false,
      percentage: 70,
      minLength: 10,
      action: 'delete' as const,
    },
  };
}

export function AutoModTab() {
  const { showToast, currentGuild } = useStore();
  const [config, setConfig] = useState<FlatConfig>(toFlat(null));
  const [channels, setChannels] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) { setLoading(false); return; }
      try {
        const [cfg, chs, rls] = await Promise.all([
          getAutoModConfig(currentGuild.id),
          getGuildChannels(currentGuild.id),
          getGuildRoles(currentGuild.id),
        ]);
        if (!mounted) return;
        setConfig(toFlat(cfg));
        setChannels(chs || []);
        setRoles(rls || []);
      } catch (err) {
        console.error('Failed to load automod config', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleSave = async () => {
    if (!currentGuild) return;
    try {
      await updateAutoModConfig(currentGuild.id, toApi(config));
      showToast('Auto-moderation config saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save config', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>;
  }

  const update = (partial: Partial<FlatConfig>) => setConfig(prev => ({ ...prev, ...partial }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Auto-Moderation</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure automatic moderation protections</p>
      </div>

      <div className="rounded-xl p-6 space-y-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Anti-Spam */}
        <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(253,224,71,0.15)' }}>
                <Shield className="w-5 h-5" style={{ color: '#FDE047' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Anti-Spam</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Automatically detect and punish spam</p>
              </div>
            </div>
            <button onClick={() => update({ antiSpamEnabled: !config.antiSpamEnabled })}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ background: config.antiSpamEnabled ? '#38BDF8' : 'var(--surface-lighter)' }}>
              <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: config.antiSpamEnabled ? 'translateX(26px)' : 'translateX(4px)' }} />
            </button>
          </div>
          {config.antiSpamEnabled && (
            <div className="grid sm:grid-cols-3 gap-4 ml-11">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Messages</label>
                <input type="number" value={config.spamThreshold}
                  onChange={(e) => update({ spamThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Per (seconds)</label>
                <input type="number" value={config.spamWindow}
                  onChange={(e) => update({ spamWindow: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Action</label>
                <select value={config.spamAction} onChange={(e) => update({ spamAction: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <option value="mute">Mute</option>
                  <option value="kick">Kick</option>
                  <option value="ban">Ban</option>
                </select>
              </div>
              {config.spamAction === 'mute' && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Mute Duration</label>
                  <input type="text" value={config.spamMuteDuration}
                    onChange={(e) => update({ spamMuteDuration: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    placeholder="e.g. 30m, 1h, 1d" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Word Filter */}
        <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(252,165,165,0.15)' }}>
                <Shield className="w-5 h-5" style={{ color: '#FCA5A5' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Word Filter</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Block messages containing specific words</p>
              </div>
            </div>
            <button onClick={() => update({ wordFilterEnabled: !config.wordFilterEnabled })}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ background: config.wordFilterEnabled ? '#38BDF8' : 'var(--surface-lighter)' }}>
              <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: config.wordFilterEnabled ? 'translateX(26px)' : 'translateX(4px)' }} />
            </button>
          </div>
          {config.wordFilterEnabled && (
            <div className="space-y-4 ml-11">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Blocked Words (one per line)</label>
                <textarea value={config.blockedWords}
                  onChange={(e) => update({ blockedWords: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none h-24 font-mono"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Exempt Roles</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={config.exemptRoles.includes(role.id)}
                          onChange={() => {
                            const newRoles = config.exemptRoles.includes(role.id)
                              ? config.exemptRoles.filter((r) => r !== role.id)
                              : [...config.exemptRoles, role.id];
                            update({ exemptRoles: newRoles });
                          }}
                          className="w-4 h-4 rounded" style={{ accentColor: '#38BDF8' }} />
                        <span className="text-sm" style={{ color: 'var(--text)' }}>{role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Exempt Channels</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {channels.map((ch) => (
                      <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={config.exemptChannels.includes(ch.id)}
                          onChange={() => {
                            const newChannels = config.exemptChannels.includes(ch.id)
                              ? config.exemptChannels.filter((c) => c !== ch.id)
                              : [...config.exemptChannels, ch.id];
                            update({ exemptChannels: newChannels });
                          }}
                          className="w-4 h-4 rounded" style={{ accentColor: '#38BDF8' }} />
                        <span className="text-sm" style={{ color: 'var(--text)' }}>#{ch.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Raid Protection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(129,140,248,0.15)' }}>
                <Shield className="w-5 h-5" style={{ color: '#818CF8' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Raid Protection</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Detect and respond to raid attempts</p>
              </div>
            </div>
            <button onClick={() => update({ raidEnabled: !config.raidEnabled })}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ background: config.raidEnabled ? '#38BDF8' : 'var(--surface-lighter)' }}>
              <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: config.raidEnabled ? 'translateX(26px)' : 'translateX(4px)' }} />
            </button>
          </div>
          {config.raidEnabled && (
            <div className="grid sm:grid-cols-3 gap-4 ml-11">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Members</label>
                <input type="number" value={config.raidThreshold}
                  onChange={(e) => update({ raidThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Per (seconds)</label>
                <input type="number" value={config.raidWindow}
                  onChange={(e) => update({ raidWindow: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Action</label>
                <select value={config.raidAction} onChange={(e) => update({ raidAction: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <option value="lockdown">Lockdown</option>
                  <option value="kick">Kick New Members</option>
                  <option value="alert">DM Alert</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
