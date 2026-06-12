import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: number;
  delay?: number;
}

export function StatCard({ icon: Icon, label, value, delta, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl p-5 transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg"
          style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
          <Icon className="w-5 h-5" style={{ color: '#38BDF8' }} />
        </div>
        {delta !== undefined && (
          <div className="flex items-center gap-1 text-xs font-medium"
            style={{ color: delta >= 0 ? '#86EFAC' : '#FCA5A5' }}>
            {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-nunito" style={{ color: 'var(--text)' }}>{value}</div>
      <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </motion.div>
  );
}
