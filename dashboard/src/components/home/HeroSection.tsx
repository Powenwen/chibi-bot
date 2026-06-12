import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DiscordEmbed, DiscordEmbedDescription, DiscordEmbedFooter, DiscordMention, DiscordMessage, DiscordMessages } from '@skyra/discord-components-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-15 blur-[100px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #C084FC 0%, transparent 70%)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-[80px] animate-pulse"
          style={{ background: 'radial-gradient(circle, #F472B6 0%, transparent 70%)', animationDelay: '4s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#7DD3FC',
              }}>
              <Sparkles className="w-3.5 h-3.5" />
              v3.5.0 is here — now with auto-responder!
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-nunito leading-tight mb-6">
              Meet <span className="text-gradient">Chibi</span> — Your Server's{' '}
              <span style={{ color: '#C084FC' }}>Friendly</span> Guardian
            </h1>
            <p className="text-lg mb-8 max-w-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              A powerful yet adorable Discord bot that handles moderation, welcomes, sticky messages, auto-reactions, suggestions, and more — all with a chibi twist.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={"https://discord.com/oauth2/authorize?client_id=1511574899305742447&permissions=8&integration_type=0&scope=bot+applications.commands"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 glow-brand"
                style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)' }}
              >
                Add to Discord <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                to="/commands"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#7DD3FC',
                  background: 'rgba(56, 189, 248, 0.05)',
                }}
              >
                <Terminal className="w-4 h-4" /> View Commands
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#86EFAC', boxShadow: '0 0 8px rgba(134,239,172,0.6)' }} />
                2,847 servers
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#38BDF8', boxShadow: '0 0 8px rgba(56,189,248,0.6)' }} />
                482K+ users
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FDE047', boxShadow: '0 0 8px rgba(253,224,71,0.6)' }} />
                12M+ commands
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl opacity-30 blur-2xl"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #C084FC)' }} />

            <div className="relative rounded-2xl p-4 shadow-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
              }}>
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#FCA5A5' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#FDE047' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#86EFAC' }} />
                <span className="text-xs ml-2" style={{ color: 'var(--text-dark)' }}>#welcome</span>
              </div>

              <div className="space-y-3">
                <DiscordMessages>
                  <DiscordMessage
                    author="Chibi Bot"
                    avatar="/chibi-icon.png"
                    bot={true}
                    roleColor="#38BDF8"
                  >
                    <DiscordEmbed
                      slot="embeds"
                      color="#38BDF8"
                      embedTitle="🎉 Welcome!"
                      authorName="Chibi Bot"
                      authorImage="/chibi-icon.png"
                      thumbnail="/chibi-icon.png"
                    >
                      <DiscordEmbedDescription slot="description">
                        Hey <DiscordMention type="user">NewUser</DiscordMention>, welcome to <strong>Gaming Central</strong>! We are glad to have you here. You are our <strong>1,234</strong>th member!
                      </DiscordEmbedDescription>
                      <DiscordEmbedFooter slot="footer">Enjoy your stay!</DiscordEmbedFooter>
                    </DiscordEmbed>
                  </DiscordMessage>
                </DiscordMessages>
              </div>
            </div>

            {/* Floating decorative elements */}
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-4 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
              }}
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-4 -left-4 w-14 h-14 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'rgba(192, 132, 252, 0.1)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                boxShadow: '0 0 20px rgba(192, 132, 252, 0.15)',
              }}
            >
              🤖
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute top-1/2 -right-8 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{
                background: 'rgba(244, 114, 182, 0.1)',
                border: '1px solid rgba(244, 114, 182, 0.25)',
                boxShadow: '0 0 20px rgba(244, 114, 182, 0.15)',
              }}
            >
              💙
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
