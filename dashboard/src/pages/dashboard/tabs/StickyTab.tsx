import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Pin } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { getStickyMessages, createStickyMessage, updateStickyMessage, deleteStickyMessage, getGuildChannels } from '../../../services/guildApi';

function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function StickyTab() {
  const { showToast, currentGuild } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ channelId: '', content: '', useEmbed: false });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!currentGuild) return;
      try {
        const [msgs, chs] = await Promise.all([
          getStickyMessages(currentGuild.id),
          getGuildChannels(currentGuild.id),
        ]);
        if (!mounted) return;
        setMessages(msgs || []);
        setChannels(chs || []);
      } catch (err) {
        console.error('Failed to load sticky messages', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentGuild]);

  const handleSave = async () => {
    if (!currentGuild) return;
    try {
      if (editing) {
        const updated = await updateStickyMessage(currentGuild.id, editing, {
          guildID: currentGuild.id,
          channelID: formData.channelId,
          content: formData.content,
          enabled: true,
          title: '',
          description: formData.content,
          color: '#38BDF8',
          thumbnailUrl: '',
          imageUrl: '',
          footer: { text: '', iconUrl: '' },
          author: { name: '', iconUrl: '', url: '' },
          fields: [],
          timestamp: false,
          embedID: '',
          maxMessageCount: 0,
          mode: 'message-count' as const,
          intervalSeconds: 0,
          mentionRoleID: '',
        });
        setMessages(messages.map((m) => (m._id === editing ? updated : m)));
        showToast('Sticky message updated!', 'success');
      } else {
        const created = await createStickyMessage(currentGuild.id, {
          guildID: currentGuild.id,
          channelID: formData.channelId,
          content: formData.content,
          enabled: true,
          title: '',
          description: formData.content,
          color: '#38BDF8',
          thumbnailUrl: '',
          imageUrl: '',
          footer: { text: '', iconUrl: '' },
          author: { name: '', iconUrl: '', url: '' },
          fields: [],
          timestamp: false,
          embedID: '',
          maxMessageCount: 0,
          mode: 'message-count' as const,
          intervalSeconds: 0,
          mentionRoleID: '',
          messageID: generateUniqueId(),
          messageChannelID: formData.channelId,
          uniqueID: generateUniqueId(),
          authorID: currentGuild.id, // will be overwritten by backend with user ID
        });
        setMessages([...messages, created]);
        showToast('Sticky message created!', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ channelId: '', content: '', useEmbed: false });
    } catch (err) {
      console.error(err);
      showToast('Failed to save sticky message', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentGuild) return;
    try {
      await deleteStickyMessage(currentGuild.id, id);
      setMessages(messages.filter((m) => m._id !== id));
      showToast('Sticky message deleted!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete sticky message', 'error');
    }
  };

  const getChannelName = (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    return ch ? ch.name : 'unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Sticky Messages</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Keep important messages pinned at the bottom of channels</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setFormData({ channelId: '', content: '', useEmbed: false }); }}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}
        >
          <Plus className="w-4 h-4" /> Add Sticky
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{editing ? 'Edit' : 'New'} Sticky Message</h3>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Channel</label>
            <select
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              className="w-full max-w-md rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <option value="">Select a channel</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>#{ch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text)' }}>Message Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none h-24"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              placeholder="Enter sticky message content..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.useEmbed}
              onChange={(e) => setFormData({ ...formData, useEmbed: e.target.checked })}
              className="w-4 h-4 rounded accent-[#38BDF8]"
            />
            <span className="text-sm" style={{ color: 'var(--text)' }}>Use embed</span>
          </label>
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

      {messages.length === 0 ? (
        <div className="rounded-xl p-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Pin className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No sticky messages yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first sticky message to keep important info visible</p>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}
          >
            Add Sticky Message
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg._id} className="rounded-xl p-5 flex items-start justify-between gap-4 transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8' }}>#{getChannelName(msg.channelID)}</span>
                  {msg.useEmbed && <span className="px-2 py-0.5 text-xs rounded" style={{ background: 'var(--surface-lighter)', color: 'var(--text-muted)' }}>Embed</span>}
                </div>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{msg.content}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Created {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(msg._id); setFormData({ channelId: msg.channelID, content: msg.content, useEmbed: msg.useEmbed }); setShowForm(true); }}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(msg._id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FCA5A5'; e.currentTarget.style.background = 'rgba(252, 165, 165, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
