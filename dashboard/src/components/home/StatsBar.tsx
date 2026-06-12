import { motion, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Server, Users, Command, Activity } from 'lucide-react';
import { botStats } from '../../data/mockData';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const controls = animate(0, value, {
            duration: 2.5,
            ease: 'easeOut',
            onUpdate: (v) => setDisplay(Math.floor(v)),
          });
          return () => controls.stop();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { icon: Server, label: 'Servers', value: botStats.guilds, suffix: '', color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.2)' },
  { icon: Users, label: 'Users Served', value: botStats.users, suffix: '', color: '#C084FC', glow: 'rgba(192, 132, 252, 0.2)' },
  { icon: Command, label: 'Commands Run', value: botStats.commandsRun, suffix: '', color: '#F472B6', glow: 'rgba(244, 114, 182, 0.2)' },
  { icon: Activity, label: 'Uptime', value: 99.97, suffix: '%', color: '#86EFAC', glow: 'rgba(134, 239, 172, 0.2)' },
];

export function StatsBar() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.03) 50%, transparent 100%)',
        }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${stat.color}40`;
                e.currentTarget.style.boxShadow = `0 0 30px ${stat.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-nunito" style={{ color: stat.color }}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
