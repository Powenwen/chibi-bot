import { useState } from 'react';
import {
  DiscordEmbed,
  DiscordEmbedDescription,
  DiscordEmbedFooter,
  DiscordMessage,
  DiscordMessages,
} from '@skyra/discord-components-react';

interface EmbedBuilderProps {
  initialTitle?: string;
  initialDescription?: string;
  initialColor?: string;
  initialThumbnail?: boolean;
  initialFooter?: string;
  onChange?: (embed: { title: string; description: string; color: string; thumbnail: boolean; footer: string }) => void;
}

export function EmbedBuilder({
  initialTitle = '',
  initialDescription = '',
  initialColor = '#38BDF8',
  initialThumbnail = false,
  initialFooter = '',
  onChange,
}: EmbedBuilderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [color, setColor] = useState(initialColor);
  const [thumbnail, setThumbnail] = useState(initialThumbnail);
  const [footer, setFooter] = useState(initialFooter);

  const handleChange = (field: string, value: string | boolean) => {
    const updates: Record<string, string | boolean> = { title, description, color, thumbnail, footer };
    updates[field] = value;
    onChange?.({
      title: updates.title as string,
      description: updates.description as string,
      color: updates.color as string,
      thumbnail: updates.thumbnail as boolean,
      footer: updates.footer as string,
    });
  };

  const inputClass = "w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors";
  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  };

  const labelClass = "text-sm font-medium mb-1.5 block";
  const labelStyle = { color: 'var(--text)' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className={labelClass} style={labelStyle}>Embed Title</label>
          <input type="text" value={title}
            onChange={(e) => { setTitle(e.target.value); handleChange('title', e.target.value); }}
            className={inputClass} style={inputStyle}
            placeholder="Welcome message title" />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Description</label>
          <textarea value={description}
            onChange={(e) => { setDescription(e.target.value); handleChange('description', e.target.value); }}
            className={`${inputClass} resize-none h-24`} style={inputStyle}
            placeholder="Use {user}, {server}, {memberCount} as variables" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass} style={labelStyle}>Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color}
                onChange={(e) => { setColor(e.target.value); handleChange('color', e.target.value); }}
                className="w-10 h-10 rounded-lg border cursor-pointer"
                style={{ borderColor: 'var(--border)', background: 'transparent' }} />
              <input type="text" value={color}
                onChange={(e) => { setColor(e.target.value); handleChange('color', e.target.value); }}
                className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none font-mono"
                style={inputStyle} />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Footer</label>
            <input type="text" value={footer}
              onChange={(e) => { setFooter(e.target.value); handleChange('footer', e.target.value); }}
              className={inputClass} style={inputStyle}
              placeholder="Footer text" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={thumbnail}
            onChange={(e) => { setThumbnail(e.target.checked); handleChange('thumbnail', e.target.checked); }}
            className="w-4 h-4 rounded accent-[#38BDF8]" />
          <span className="text-sm" style={{ color: 'var(--text)' }}>Show user avatar as thumbnail</span>
        </label>
      </div>
      <div>
        <label className={labelClass} style={{ ...labelStyle, color: 'var(--text-muted)' }}>Preview</label>
        <div className="rounded-xl p-4" style={{ background: 'var(--discord-bg)', border: '1px solid var(--border)' }}>
          <DiscordMessages>
            <DiscordMessage author="Chibi Bot" avatar="/chibi-icon.png" bot roleColor="#38BDF8">
              <DiscordEmbed
                slot="embeds"
                color={color}
                embedTitle={title || undefined}
                thumbnail={thumbnail ? '/chibi-icon.png' : undefined}
              >
                <DiscordEmbedDescription slot="description">
                  {description || 'Embed description preview...'}
                </DiscordEmbedDescription>
                {footer && (
                  <DiscordEmbedFooter slot="footer">{footer}</DiscordEmbedFooter>
                )}
              </DiscordEmbed>
            </DiscordMessage>
          </DiscordMessages>
        </div>
      </div>
    </div>
  );
}
