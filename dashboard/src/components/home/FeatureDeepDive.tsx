import { motion } from 'framer-motion';
import { Shield, Settings, Smile } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    title: 'Moderation at a Glance',
    description: 'Track every moderation action with detailed case IDs, reasons, and timestamps. View warning escalation rules, auto-moderation triggers, and full audit trails — all in one clean interface.',
    color: '#FCA5A5',
    glow: 'rgba(252, 165, 165, 0.15)',
    mockup: (
      <div className="rounded-xl p-4 space-y-2 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid rgba(252, 165, 165, 0.15)' }}>
        <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-dark)' }}>
          <span>Moderation Logs</span>
          <span>Filter: All</span>
        </div>
        {[
          { action: 'Warn', user: 'ToxicPlayer', mod: 'ModUser', color: '#FDE047' },
          { action: 'Mute', user: 'LoudMouth', mod: 'AdminUser', color: '#818CF8' },
          { action: 'Ban', user: 'BadActor', mod: 'AdminUser', color: '#FCA5A5' },
        ].map((log, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-2.5"
            style={{ background: 'var(--bg-light)' }}>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: log.color }}>
              {log.action}
            </span>
            <span className="text-xs" style={{ color: 'var(--text)' }}>{log.user}</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-dark)' }}>by {log.mod}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Settings,
    title: 'Configure Without Code',
    description: 'Every feature is configurable through our intuitive web dashboard. Toggle systems on and off, set channels, customize messages, and manage permissions — no coding required.',
    color: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.15)',
    mockup: (
      <div className="rounded-xl p-4 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
        <div className="text-xs mb-3" style={{ color: 'var(--text-dark)' }}>Welcome System</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text)' }}>Enabled</span>
            <div className="w-8 h-4 rounded-full relative" style={{ background: '#86EFAC' }}>
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text)' }}>Channel</span>
            <span className="text-xs" style={{ color: 'var(--text-dark)' }}>#welcome</span>
          </div>
          <div className="rounded-lg p-2 mt-2" style={{ background: 'var(--bg-light)' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-dark)' }}>Message Template</span>
            <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>Welcome {'{user}'} to {'{server}'}!</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Smile,
    title: 'React to Everything',
    description: 'Set up auto-reactions with powerful regex patterns. React to Spotify links in music channels, greet messages in general, or celebrate achievements with custom emoji — automatically.',
    color: '#C084FC',
    glow: 'rgba(192, 132, 252, 0.15)',
    mockup: (
      <div className="rounded-xl p-4 overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid rgba(192, 132, 252, 0.15)' }}>
        <div className="text-xs mb-3" style={{ color: 'var(--text-dark)' }}>Auto-Reaction Rules</div>
        <div className="space-y-2">
          {[
            { channel: '#memes', emoji: '😂', pattern: 'All messages' },
            { channel: '#music', emoji: '🎵', pattern: 'spotify|youtube' },
            { channel: '#general', emoji: '👋', pattern: 'hello|hi|hey' },
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'var(--bg-light)' }}>
              <span className="text-sm">{rule.emoji}</span>
              <div className="min-w-0">
                <div className="text-xs" style={{ color: 'var(--text)' }}>{rule.channel}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-dark)' }}>{rule.pattern}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function FeatureDeepDive() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(56,189,248,0.05) 0%, transparent 50%)',
        }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-black font-nunito mb-4" style={{ color: 'var(--text)' }}>
            Built for Admins, Loved by Members
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            See how Chibi Bot transforms your server management experience with powerful yet simple tools.
          </p>
        </motion.div>

        <div className="space-y-24">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${section.color}15` }}>
                  <section.icon className="w-6 h-6" style={{ color: section.color }} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>
                  {section.title}
                </h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {section.description}
                </p>
              </div>
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="relative">
                  <div className="absolute inset-0 blur-3xl opacity-20 rounded-3xl"
                    style={{ background: section.color }} />
                  <div className="relative">
                    {section.mockup}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
