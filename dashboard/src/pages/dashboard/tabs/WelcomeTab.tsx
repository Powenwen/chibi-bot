import { useState, useEffect } from 'react';
import { Send, Save, RotateCcw } from 'lucide-react';
import { EmbedBuilder } from '../../../components/ui/EmbedBuilder';
import { useStore } from '../../../store/useStore';
import { getWelcomeConfig, updateWelcomeConfig, getGuildChannels } from '../../../services/guildApi';

export function WelcomeTab() {
  const { showToast, currentGuild } = useStore();
  const [config, setConfig] = useState<any>(null);
  const [channels, setChannels] = useState<Array<any>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) return;
      // loading state not used in UI currently
      try {
        const cfg = await getWelcomeConfig(currentGuild.id);
        const ch = await getGuildChannels(currentGuild.id);
        if (!mounted) return;
        setConfig(cfg ? {
          enabled: cfg.enabled ?? false,
          channelId: cfg.channelID || '',
          messageTemplate: cfg.message || 'Welcome {user} to {server}!',
          useEmbed: cfg.useEmbed ?? false,
          embedTitle: cfg.embed?.title || '',
          embedDescription: cfg.embed?.description || '',
          embedColor: cfg.embed?.color || '#38BDF8',
          embedThumbnail: cfg.embed?.thumbnail ?? false,
          embedFooter: cfg.embed?.footer?.text || '',
        } : {
          enabled: false,
          channelId: '',
          messageTemplate: 'Welcome {user} to {server}!',
          useEmbed: false,
          embedTitle: '',
          embedDescription: '',
          embedColor: '#38BDF8',
          embedThumbnail: false,
          embedFooter: '',
        });
        setChannels(ch || []);
      } catch (err) {
        console.error(err);
      } finally {
        // no-op
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleSave = async () => {
    if (!currentGuild || !config) return;
    try {
      await updateWelcomeConfig(currentGuild.id, {
        guildID: currentGuild.id,
        channelID: config.channelId || '',
        enabled: config.enabled ?? false,
        message: config.messageTemplate || '',
        type: 'embed',
        dmEnabled: false,
        dmMessage: '',
        roleEnabled: false,
        roleIDs: [],
        embed: {
          title: config.embedTitle || '',
          description: config.embedDescription || '',
          color: config.embedColor || '#38BDF8',
          thumbnail: config.embedThumbnail ?? false,
          thumbnailUrl: '',
          image: false,
          imageUrl: '',
          author: { enabled: false, name: '', iconUrl: '', url: '' },
          footer: { enabled: !!config.embedFooter, text: config.embedFooter || '', iconUrl: '', timestamp: false },
          fields: [],
          timestamp: false,
        },
      });
      showToast('Welcome configuration saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save configuration', 'error');
    }
  };

  const handleTest = () => {
    showToast('Test welcome message queued (backend placeholder)', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Welcome System</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure how new members are greeted</p>
        </div>
          <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm" style={{ color: 'var(--text)' }}>{config?.enabled ? 'Enabled' : 'Disabled'}</span>
          <button
            onClick={() => setConfig({ ...config, enabled: !config?.enabled })}
            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
            style={{ background: config?.enabled ? '#38BDF8' : 'var(--surface-lighter)' }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full transition-transform"
              style={{
                background: 'white',
                transform: config?.enabled ? 'translateX(26px)' : 'translateX(4px)',
                boxShadow: config?.enabled ? '0 0 10px rgba(56,189,248,0.5)' : 'none',
              }}
            />
          </button>
        </label>
      </div>

      <div className="rounded-xl p-6 space-y-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Welcome Channel</label>
          <select
            value={config?.channelId || ''}
            onChange={(e) => setConfig({ ...config, channelId: e.target.value })}
            className="w-full max-w-md rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>#{ch.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Message Template</label>
          <textarea
            value={config?.messageTemplate || ''}
            onChange={(e) => setConfig({ ...config, messageTemplate: e.target.value })}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none h-20"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {['{user}', '{user.tag}', '{server}', '{memberCount}'].map((variable) => (
              <button
                key={variable}
                onClick={() => setConfig({ ...config, messageTemplate: (config?.messageTemplate || '') + ' ' + variable })}
                className="px-2 py-1 text-xs rounded-md transition-colors hover:opacity-80"
                style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}
              >
                {variable}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={!!config?.useEmbed}
              onChange={(e) => setConfig({ ...config, useEmbed: e.target.checked })}
              className="w-4 h-4 rounded accent-[#38BDF8]"
              style={{ accentColor: '#38BDF8' }}
            />
            <span className="text-sm" style={{ color: 'var(--text)' }}>Use embed for welcome message</span>
          </label>

          {config?.useEmbed && (
            <EmbedBuilder
              initialTitle={config?.embedTitle}
              initialDescription={config?.embedDescription}
              initialColor={config?.embedColor}
              initialThumbnail={config?.embedThumbnail}
              initialFooter={config?.embedFooter}
              onChange={(embed) => setConfig({
                ...config,
                embedTitle: embed.title,
                embedDescription: embed.description,
                embedColor: embed.color,
                embedThumbnail: embed.thumbnail,
                embedFooter: embed.footer,
              })}
            />
          )}
        </div>

        <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
          <button
            onClick={handleTest}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all hover:scale-105"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <Send className="w-4 h-4" /> Send Test Message
          </button>
          <button
            onClick={() => {/* reset to defaults */}}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ml-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
