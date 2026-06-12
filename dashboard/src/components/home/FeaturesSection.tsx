import { motion } from 'framer-motion';
import { PartyPopper, Pin, Smile, Bot, Lightbulb, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  glow: string;
}

const features: Feature[] = [
  {
    icon: PartyPopper,
    title: 'Welcome System',
    description: 'Greet new members with customizable rich embeds. Use variables like {user}, {server}, and {memberCount} to personalize every welcome.',
    gradient: 'from-[#38BDF8] to-[#22D3EE]',
    glow: 'rgba(56, 189, 248, 0.2)',
  },
  {
    icon: Pin,
    title: 'Sticky Messages',
    description: 'Keep important messages pinned at the bottom of any channel. Perfect for rules, announcements, or ongoing discussions.',
    gradient: 'from-[#818CF8] to-[#A78BFA]',
    glow: 'rgba(129, 140, 248, 0.2)',
  },
  {
    icon: Smile,
    title: 'Auto-Reactions',
    description: 'Automatically react to messages with emoji, powered by regex patterns. Trigger on keywords, URLs, or any message in a channel.',
    gradient: 'from-[#C084FC] to-[#D8B4FE]',
    glow: 'rgba(192, 132, 252, 0.2)',
  },
  {
    icon: Bot,
    title: 'Auto-Responder',
    description: 'Keyword-triggered automatic replies with embed support. Set up FAQs, rules references, or fun responses for your community.',
    gradient: 'from-[#F472B6] to-[#F9A8D4]',
    glow: 'rgba(244, 114, 182, 0.2)',
  },
  {
    icon: Lightbulb,
    title: 'Suggestion System',
    description: 'A full suggestion submission and admin approval workflow. Members vote, admins review, and great ideas get implemented.',
    gradient: 'from-[#FDE047] to-[#FEF08A]',
    glow: 'rgba(253, 224, 71, 0.2)',
  },
  {
    icon: Shield,
    title: 'Advanced Moderation',
    description: 'Warnings, auto-mod, bans, kicks, case tracking, and escalation rules. Keep your server safe without the manual work.',
    gradient: 'from-[#86EFAC] to-[#BBF7D0]',
    glow: 'rgba(134, 239, 172, 0.2)',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-black font-nunito mb-4" style={{ color: 'var(--text)' }}>
            Everything Your Server Needs
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            From welcoming new members to advanced moderation, Chibi Bot packs all the essential tools into one friendly package.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-2xl p-6 transition-all duration-300 group cursor-default"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                e.currentTarget.style.boxShadow = `0 0 30px ${feature.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.gradient} transition-transform duration-300 group-hover:scale-110`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold font-nunito mb-2" style={{ color: 'var(--text)' }}>{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
