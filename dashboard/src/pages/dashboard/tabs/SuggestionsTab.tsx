import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Check, Lightbulb, Settings } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { getSuggestions, getSuggestionConfig, updateSuggestionConfig, approveSuggestion, denySuggestion, getGuildChannels } from '../../../services/guildApi';

const statusStyles: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(253, 224, 71, 0.12)', color: '#FDE047' },
  approved: { bg: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' },
  denied: { bg: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' },
  implemented: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' },
};

export function SuggestionsTab() {
  const { showToast, currentGuild } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'config'>('list');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    enabled: true,
    suggestionChannel: '',
    approvalChannel: '',
    upvoteEmoji: '👍',
    downvoteEmoji: '👎',
    requireDenialReason: true,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) return;
      try {
        const [sugs, cfg, chs] = await Promise.all([
          getSuggestions(currentGuild.id),
          getSuggestionConfig(currentGuild.id),
          getGuildChannels(currentGuild.id),
        ]);
        if (!mounted) return;
        setSuggestions(sugs?.suggestions || sugs || []);
        setChannels(chs || []);
        if (cfg) {
          setConfig({
            enabled: cfg.enabled ?? true,
            suggestionChannel: cfg.channelID || '',
            approvalChannel: '',
            upvoteEmoji: cfg.emojis?.upvote || '👍',
            downvoteEmoji: cfg.emojis?.downvote || '👎',
            requireDenialReason: true,
          });
        }
      } catch (err) {
        console.error('Failed to load suggestions', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const filtered = statusFilter === 'all'
    ? suggestions
    : suggestions.filter((s) => (s.status || '').toLowerCase() === statusFilter.toLowerCase());

  const handleStatusChange = async (id: string, status: string) => {
    if (!currentGuild) return;
    try {
      if (status === 'approved') {
        await approveSuggestion(currentGuild.id, id);
      } else {
        await denySuggestion(currentGuild.id, id);
      }
      setSuggestions(suggestions.map((s) => (s._id === id ? { ...s, status } : s)));
      showToast(`Suggestion ${status}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update suggestion', 'error');
    }
  };

  const handleSaveConfig = async () => {
    if (!currentGuild) return;
    try {
      await updateSuggestionConfig(currentGuild.id, {
        enabled: config.enabled,
        channelID: config.suggestionChannel,
        emojis: { upvote: config.upvoteEmoji, downvote: config.downvoteEmoji },
      });
      showToast('Configuration saved!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save configuration', 'error');
    }
  };

  // Model uses capitalized status values: 'Pending', 'Approved', 'Denied', 'Implemented'
  const statusCounts = {
    all: suggestions.length,
    pending: suggestions.filter((s) => (s.status || '').toLowerCase() === 'pending').length,
    approved: suggestions.filter((s) => (s.status || '').toLowerCase() === 'approved').length,
    denied: suggestions.filter((s) => (s.status || '').toLowerCase() === 'denied').length,
    implemented: suggestions.filter((s) => (s.status || '').toLowerCase() === 'implemented').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Suggestions</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage community suggestions and configure the system</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveSubTab('list')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeSubTab === 'list' ? 'linear-gradient(135deg, #38BDF8, #818CF8)' : 'var(--surface)',
              color: activeSubTab === 'list' ? 'white' : 'var(--text-muted)',
              border: activeSubTab === 'list' ? 'none' : '1px solid var(--border)',
            }}>
            <Lightbulb className="w-4 h-4" /> Suggestions
          </button>
          <button onClick={() => setActiveSubTab('config')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeSubTab === 'config' ? 'linear-gradient(135deg, #38BDF8, #818CF8)' : 'var(--surface)',
              color: activeSubTab === 'config' ? 'white' : 'var(--text-muted)',
              border: activeSubTab === 'config' ? 'none' : '1px solid var(--border)',
            }}>
            <Settings className="w-4 h-4" /> Configuration
          </button>
        </div>
      </div>

      {activeSubTab === 'config' ? (
        <div className="rounded-xl p-6 space-y-6 max-w-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <button onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
              style={{ background: config.enabled ? '#38BDF8' : 'var(--surface-lighter)' }}>
              <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: config.enabled ? 'translateX(26px)' : 'translateX(4px)' }} />
            </button>
            <span className="text-sm" style={{ color: 'var(--text)' }}>Enable Suggestion System</span>
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Suggestion Channel</label>
              <select value={config.suggestionChannel} onChange={(e) => setConfig({ ...config, suggestionChannel: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>#{ch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Approval Channel</label>
              <select value={config.approvalChannel} onChange={(e) => setConfig({ ...config, approvalChannel: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>#{ch.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Upvote Emoji</label>
              <input type="text" value={config.upvoteEmoji} onChange={(e) => setConfig({ ...config, upvoteEmoji: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Downvote Emoji</label>
              <input type="text" value={config.downvoteEmoji} onChange={(e) => setConfig({ ...config, downvoteEmoji: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={config.requireDenialReason}
              onChange={(e) => setConfig({ ...config, requireDenialReason: e.target.checked })}
              className="w-4 h-4 rounded accent-[#38BDF8]" />
            <span className="text-sm" style={{ color: 'var(--text)' }}>Require reason for denial</span>
          </label>

          <button onClick={handleSaveConfig}
            className="px-5 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
            Save Configuration
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'denied', 'implemented'] as const).map((status) => (
              <button key={status} onClick={() => setStatusFilter(status)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: statusFilter === status ? 'linear-gradient(135deg, #38BDF8, #818CF8)' : 'var(--surface)',
                  color: statusFilter === status ? 'white' : 'var(--text-muted)',
                  border: statusFilter === status ? 'none' : '1px solid var(--border)',
                }}>
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((suggestion) => {
              const style = statusStyles[suggestion.status];
              return (
                <div key={suggestion._id} className="rounded-xl overflow-hidden transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <div onClick={() => setExpandedId(expandedId === suggestion._id ? null : suggestion._id)}
                    className="p-5 cursor-pointer transition-colors hover:bg-[var(--bg-light)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{ background: style.bg, color: style.color }}>
                            {suggestion.status}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by {suggestion.authorName || suggestion.authorID || 'Unknown'}</span>
                        </div>
                        <h4 className="text-sm font-medium" style={{ color: 'var(--text)' }}>{suggestion.suggestion || suggestion.summary || suggestion.content || ''}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1" style={{ color: '#86EFAC' }}>👍 {Array.isArray(suggestion.upvotes) ? suggestion.upvotes.length : suggestion.upvotes}</span>
                        <span className="flex items-center gap-1" style={{ color: '#FCA5A5' }}>👎 {Array.isArray(suggestion.downvotes) ? suggestion.downvotes.length : suggestion.downvotes}</span>
                        <span>{suggestion.createdAt ? new Date(suggestion.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>

                  {expandedId === suggestion._id && (
                    <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{suggestion.suggestion || suggestion.fullText || suggestion.content || ''}</p>
                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleStatusChange(suggestion._id, 'approved')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                            style={{ background: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => handleStatusChange(suggestion._id, 'denied')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                            style={{ background: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' }}>
                            <XCircle className="w-3.5 h-3.5" /> Deny
                          </button>
                          <button onClick={() => handleStatusChange(suggestion._id, 'implemented')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                            style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8' }}>
                            <Check className="w-3.5 h-3.5" /> Mark Implemented
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
