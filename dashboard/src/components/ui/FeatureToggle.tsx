import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureToggleProps {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FeatureToggle({ icon: Icon, title, description, enabled, loading = false, onToggle }: FeatureToggleProps) {
  const [isOn, setIsOn] = useState(enabled);

  const handleToggle = () => {
    if (loading) return;
    const newState = !isOn;
    setIsOn(newState);
    onToggle(newState);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="rounded-xl p-5 transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isOn ? 'rgba(56, 189, 248, 0.3)' : 'var(--border)'}`,
        boxShadow: isOn ? '0 0 20px rgba(56, 189, 248, 0.08)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg transition-colors"
            style={{ background: isOn ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-lighter)' }}>
            <Icon className="w-5 h-5 transition-colors"
              style={{ color: isOn ? '#38BDF8' : 'var(--text-muted)' }} />
          </div>
          <div>
            <h3 className="font-semibold font-nunito" style={{ color: 'var(--text)' }}>{title}</h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
          style={{ background: isOn ? '#38BDF8' : 'var(--surface-lighter)', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: 'white' }} />
          ) : (
            <span
              className="pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform"
              style={{
                background: 'white',
                transform: isOn ? 'translateX(22px)' : 'translateX(2px)',
                marginTop: '2px',
              }}
            />
          )}
        </button>
      </div>
    </motion.div>
  );
}
