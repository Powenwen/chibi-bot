import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const BOT_INVITE_URL = "https://discord.com/oauth2/authorize?client_id=1511574899305742447&permissions=8&integration_type=0&scope=bot+applications.commands";

/** Build Discord CDN URL from guild icon hash */
function getGuildIconUrl(icon: string | null, guildId: string): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=128`;
}

/** Get initials from guild name (first letter of each word, max 3) */
function getGuildInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 3)
    .join('');
}

/** Guild icon with fallback to initials */
export function GuildIcon({ guild, size = 56 }: { guild: { id: string; name: string; icon: string | null }; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const iconUrl = getGuildIconUrl(guild.icon, guild.id);

  if (iconUrl && !imgError) {
    return (
      <img
        src={iconUrl}
        alt={guild.name}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: colored circle with initials
  const initials = getGuildInitials(guild.name);
  // Generate a consistent color from the guild id
  const hue = parseInt(guild.id.slice(-6), 16) % 360;

  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold font-nunito"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue}, 60%, 25%)`,
        color: `hsl(${hue}, 80%, 75%)`,
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  );
}

export function GuildSelectPage() {
  const { user, setCurrentGuild, guilds } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = guilds.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const botGuilds = filtered.filter((g) => g.botInGuild);
  const noBotGuilds = filtered.filter((g) => !g.botInGuild);

  const handleSelectGuild = (guild: typeof guilds[0]) => {
    if (!guild.botInGuild) return;
    setCurrentGuild(guild);
    navigate(`/dashboard/${guild.id}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black font-nunito mb-3" style={{ color: 'var(--text)' }}>
            Select a Server
          </h1>
          <p className="" style={{ color: 'var(--text-muted)' }}>
            Welcome back, <span className="font-medium" style={{ color: 'var(--text)' }}>{user?.username}</span>! Choose a server to manage.
          </p>
        </motion.div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search servers..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>No servers found</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You need Manage Server or Administrator permission in a server where the bot is added.</p>
            <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)' }}>
              <Plus className="w-4 h-4" /> Add Bot to Your Server
            </a>
          </div>
        ) : (
          <>
            {botGuilds.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Servers with Bot ({botGuilds.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {botGuilds.map((guild, i) => (
                    <motion.div key={guild.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      onClick={() => handleSelectGuild(guild)}
                      className="rounded-xl p-5 transition-all cursor-pointer group"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                      <div className="flex items-start justify-between mb-4">
                        <GuildIcon guild={guild} />
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
                          style={{ background: 'rgba(134, 239, 172, 0.12)', color: '#86EFAC' }}>
                          <CheckCircle className="w-3 h-3" /> Bot Active
                        </div>
                      </div>
                      <h3 className="font-bold font-nunito mb-1 transition-colors group-hover:text-[#38BDF8]"
                        style={{ color: 'var(--text)' }}>{guild.name}</h3>
                      <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        <Users className="w-3.5 h-3.5" />
                        {guild.owner ? 'Owner' : 'Manager'}
                      </div>
                      <div className="flex items-center justify-between">
                        <ArrowRight className="w-4 h-4 transition-colors" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {noBotGuilds.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Servers without Bot ({noBotGuilds.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {noBotGuilds.map((guild, i) => (
                    <motion.div key={guild.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="rounded-xl p-5 transition-all group"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: 0.7 }}>
                      <div className="flex items-start justify-between mb-4">
                        <GuildIcon guild={guild} />
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
                          style={{ background: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' }}>
                          <XCircle className="w-3 h-3" /> Bot Not Added
                        </div>
                      </div>
                      <h3 className="font-bold font-nunito mb-1" style={{ color: 'var(--text)' }}>{guild.name}</h3>
                      <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        <Users className="w-3.5 h-3.5" />
                        {guild.owner ? 'Owner' : 'Manager'}
                      </div>
                      <a href={BOT_INVITE_URL} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#818CF8]"
                        style={{ color: '#818CF8' }}>
                        <Plus className="w-3.5 h-3.5" /> Add Bot to Server
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
