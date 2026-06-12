interface DiscordEmbedProps {
  title?: string;
  description?: string;
  color?: string;
  thumbnail?: boolean;
  footer?: string;
  authorName?: string;
  authorAvatar?: string;
}

export function DiscordEmbed({
  title = '',
  description = '',
  color = '#38BDF8',
  thumbnail = false,
  footer = '',
  authorName = 'Chibi Bot',
  authorAvatar = '/chibi-icon.png',
}: DiscordEmbedProps) {
  const processedDescription = description
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\{user\}/g, '<span style="color:var(--color-brand)">@NewUser</span>')
    .replace(/\{server\}/g, '<strong>Server Name</strong>')
    .replace(/\{memberCount\}/g, '<strong>1,234</strong>');

  return (
    <div className="rounded-lg overflow-hidden max-w-md"
      style={{ background: 'var(--discord-embed-bg)' }}>
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
        <div className="p-3 flex-1 min-w-0">
          {authorName && (
            <div className="flex items-center gap-2 mb-2">
              {authorAvatar && (
                <img src={authorAvatar} alt="" className="w-5 h-5 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <span className="text-xs font-semibold" style={{ color: 'var(--discord-text)' }}>{authorName}</span>
            </div>
          )}
          {title && <div className="text-sm font-semibold mb-1" style={{ color: 'var(--discord-text)' }}>{title}</div>}
          {description && (
            <div
              className="text-sm leading-relaxed"
              style={{ color: 'var(--discord-muted)' }}
              dangerouslySetInnerHTML={{ __html: processedDescription }}
            />
          )}
          {thumbnail && (
            <div className="mt-2 flex justify-end">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
                <span className="text-2xl">👤</span>
              </div>
            </div>
          )}
          {footer && <div className="text-xs mt-2" style={{ color: 'var(--discord-muted)' }}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
