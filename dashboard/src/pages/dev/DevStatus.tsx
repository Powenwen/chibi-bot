import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Activity, Database, Wifi, Server, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

const services = [
  { name: 'Bot Process', status: 'online', icon: Server },
  { name: 'MongoDB', status: 'online', icon: Database },
  { name: 'Redis', status: 'online', icon: Database },
  { name: 'Discord WebSocket', status: 'online', icon: Wifi },
];

const uptimeHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  status: Math.random() > 0.95 ? 'degraded' : Math.random() > 0.98 ? 'down' : 'up',
}));

export function DevStatus() {
  const { showToast } = useStore();
  const [cacheKeys, setCacheKeys] = useState(12483);
  const [cacheHitRate, setCacheHitRate] = useState(94.2);

  const handleClearCache = () => {
    setCacheKeys(0);
    setCacheHitRate(0);
    showToast('Cache cleared!', 'success');
  };

  const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    online: { bg: 'rgba(134, 239, 172, 0.12)', text: '#86EFAC', icon: CheckCircle },
    degraded: { bg: 'rgba(253, 224, 71, 0.12)', text: '#FDE047', icon: Activity },
    down: { bg: 'rgba(252, 165, 165, 0.12)', text: '#FCA5A5', icon: XCircle },
  };

  const dayColors: Record<string, { bg: string; text: string }> = {
    up: { bg: 'rgba(134, 239, 172, 0.2)', text: '#86EFAC' },
    degraded: { bg: 'rgba(253, 224, 71, 0.2)', text: '#FDE047' },
    down: { bg: 'rgba(252, 165, 165, 0.2)', text: '#FCA5A5' },
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>Bot Status</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Service health and system monitoring</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#86EFAC', boxShadow: '0 0 8px rgba(134,239,172,0.6)' }} />
        <span className="text-lg font-semibold" style={{ color: '#86EFAC' }}>Online</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>All systems operational</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service, i) => {
          const colors = statusColors[service.status];
          const Icon = colors.icon;
          return (
            <motion.div key={service.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl p-5 transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${colors.text}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div className="flex items-center justify-between mb-3">
                <service.icon className="w-5 h-5" style={{ color: colors.text }} />
                <Icon className="w-4 h-4" style={{ color: colors.text }} />
              </div>
              <div className="text-sm font-medium capitalize" style={{ color: colors.text }}>{service.status}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text)' }}>{service.name}</div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>Uptime History (Last 30 Days)</h3>
        <div className="flex flex-wrap gap-1.5">
          {uptimeHistory.map((day, i) => {
            const dc = dayColors[day.status];
            return (
              <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold"
                style={{ background: dc.bg, color: dc.text }} title={`Day ${day.day}: ${day.status}`}>
                {day.day}
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-bold font-nunito mb-4" style={{ color: 'var(--text)' }}>Cache Statistics</h3>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{cacheKeys.toLocaleString()}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Redis Keys</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{cacheHitRate}%</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Hit Rate</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>128MB</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Memory Used</div>
          </div>
        </div>
        <button onClick={handleClearCache}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
          style={{ background: 'rgba(252, 165, 165, 0.12)', color: '#FCA5A5' }}>
          <Trash2 className="w-4 h-4" /> Clear All Cache
        </button>
      </motion.div>
    </div>
  );
}
