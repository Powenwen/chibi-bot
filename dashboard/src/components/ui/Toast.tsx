import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function Toast() {
  const { toast, clearToast } = useStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
  };

  const styles = {
    success: {
      border: '1px solid rgba(134, 239, 172, 0.3)',
      background: 'rgba(134, 239, 172, 0.08)',
      color: '#86EFAC',
      glow: '0 0 20px rgba(134, 239, 172, 0.15)',
    },
    error: {
      border: '1px solid rgba(252, 165, 165, 0.3)',
      background: 'rgba(252, 165, 165, 0.08)',
      color: '#FCA5A5',
      glow: '0 0 20px rgba(252, 165, 165, 0.15)',
    },
    warning: {
      border: '1px solid rgba(253, 224, 71, 0.3)',
      background: 'rgba(253, 224, 71, 0.08)',
      color: '#FDE047',
      glow: '0 0 20px rgba(253, 224, 71, 0.15)',
    },
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-[100]"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md"
            style={{
              border: styles[toast.type].border,
              background: styles[toast.type].background,
              boxShadow: styles[toast.type].glow,
            }}
          >
            {(() => {
              const Icon = icons[toast.type];
              return <Icon className="w-5 h-5 shrink-0" style={{ color: styles[toast.type].color }} />;
            })()}
            <span className="text-sm font-medium" style={{ color: styles[toast.type].color }}>
              {toast.message}
            </span>
            <button
              onClick={clearToast}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: styles[toast.type].color }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
